const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* ================== FILE LƯU ================== */
const DATA_FILE = path.join(__dirname, "data.json");

/* ================== LOAD DATA ================== */
let state = {
    lastPhien: null,
    chuoiCau: "",
    duDoanTruoc: null,
    win: 0,
    loss: 0
};

if (fs.existsSync(DATA_FILE)) {
    try {
        state = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch (e) {
        console.log("⚠️ Lỗi đọc data.json, reset dữ liệu");
    }
}

/* ================== SAVE DATA ================== */
function saveState() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

/* ================== NỐI CHUỖI CẦU DÀI ================== */
function appendChuoiCau(chuoi, kyTu, max = 500) {
    if (!kyTu) return chuoi;

    chuoi += kyTu;

    if (chuoi.length > max) {
        chuoi = chuoi.slice(chuoi.length - max);
    }

    return chuoi;
}

/* ================== TÁCH 20 CHUỖI CẦU ================== */
function tachChuoiCau(chuoi, limit = 20) {
    if (!chuoi || chuoi.length === 0) return [];

    const result = [];
    let temp = chuoi[0];

    for (let i = 1; i < chuoi.length; i++) {
        if (chuoi[i] === chuoi[i - 1]) {
            temp += chuoi[i];
        } else {
            result.push(temp);
            temp = chuoi[i];
        }
    }
    result.push(temp);

    return result.slice(-limit);
}

/* ================== THUẬT TOÁN SOI CẦU (THEO CẦU) ================== */
function tinhDuDoan(chuoi) {
    const patterns = [
        { name: "1-1", list: ["TXTX", "XTXT"], tc: 72 },
        { name: "2-1-2", list: ["TTXTT", "XXTXX"], tc: 75 },
        { name: "3-1", list: ["TTTX", "XXXT"], tc: 78 },
        { name: "1-4", list: ["TXXXX", "XTTTT"], tc: 83 },
        { name: "1-5", list: ["TXXXXX", "XTTTTT"], tc: 81 },
        { name: "1-6", list: ["TXXXXXX", "XTTTTTT"], tc: 87 },
        { name: "6-2-1", list: ["TTTTTTXXT", "XXXXXXTTX"], tc: 87 },
        { name: "4-1", list: ["TTTTX", "XXXXT"], tc: 78 },
        { name: "5-1", list: ["TTTTTX", "XXXXXT"], tc: 91 },
        { name: "6-1", list: ["TTTTTTX", "XXXXXXT"], tc: 89 },
        { name: "1-2-6", list: ["TXXTTTTTT", "XTTXXXXXX"], tc: 84 },
        { name: "3-1-3", list: ["TTTXTTT", "XXXTXXX"], tc: 82 },
        { name: "1-2-4", list: ["TXXTTTT", "XTTXXXX"], tc: 85 },
        { name: "Bệt", list: ["TTTTT", "XXXXX"], tc: 90 },
        { name: "2-2", list: ["TTXX", "XXTT"], tc: 70 },
        { name: "3-3", list: ["TTTXXX", "XXXTTT"], tc: 80 },
        { name: "4-4", list: ["TTTTXXXX", "XXXXTTTT"], tc: 83 },
        { name: "4-5", list: ["TTTTXXXXX", "XXXXTTTTT"], tc: 88 }
    ];

    for (const p of patterns) {
        for (const pat of p.list) {
            if (chuoi.endsWith(pat)) {
                const last = pat[pat.length - 1];
                return {
                    tenCau: p.name,
                    duDoan: last === "T" ? "Tài" : "Xỉu", // ✅ theo cầu
                    doTinCay: p.tc,
                    mucDoTinCay:
                        p.tc >= 85 ? "Rất cao" :
                        p.tc >= 75 ? "Cao" :
                        "Trung bình"
                };
            }
        }
    }

    return {
        tenCau: "Chưa rõ cầu",
        duDoan: "Chờ thêm dữ liệu",
        doTinCay: 55,
        mucDoTinCay: "Thấp"
    };
}

/* ================== API ================== */
app.get("/api/sun", async (req, res) => {
    try {
        const { data } = await axios.get(
            "https://sunwinsaygex-pcl2.onrender.com/api/sun"
        );

        if (!data || !data.phien || !data.ket_qua) {
            return res.json({ error: "Dữ liệu không hợp lệ" });
        }

        const kyTu = data.ket_qua === "Tài" ? "T" : "X";

        /* ====== PHIÊN MỚI ====== */
        if (data.phien !== state.lastPhien) {

            /* ====== SO KẾT QUẢ DỰ ĐOÁN TRƯỚC ====== */
            if (
                state.duDoanTruoc &&
                state.duDoanTruoc !== "Chờ thêm dữ liệu"
            ) {
                if (state.duDoanTruoc === data.ket_qua) {
                    state.win++;
                } else {
                    state.loss++;
                }
            }

            /* ====== NỐI CHUỖI ====== */
            state.chuoiCau = appendChuoiCau(state.chuoiCau, kyTu);
            state.lastPhien = data.phien;

            saveState();
        }

        /* ====== DỰ ĐOÁN ====== */
        const kq = tinhDuDoan(state.chuoiCau);
        state.duDoanTruoc = kq.duDoan;
        saveState();

        const chuoiCau20 = tachChuoiCau(state.chuoiCau, 20);

        res.json({
            phien: data.phien,
            ket_qua: data.ket_qua,
            phien_hien_tai: data.phien_hien_tai,

            chuoi_cau_day_du: state.chuoiCau,
            chuoi_cau: chuoiCau20,
            so_chuoi: chuoiCau20.length,

            ten_cau: kq.tenCau,
            du_doan: kq.duDoan,
            do_tin_cay: kq.doTinCay,
            muc_do_tin_cay: kq.mucDoTinCay,

            win: state.win,
            loss: state.loss,
            ti_le_thang:
                state.win + state.loss > 0
                    ? ((state.win / (state.win + state.loss)) * 100).toFixed(2) + "%"
                    : "0%"
        });

    } catch (err) {
        res.status(500).json({ error: "Không lấy được dữ liệu" });
    }
});

/* ================== START ================== */
app.listen(PORT, () => {
    console.log("🚀 SUN API chạy tại port", PORT);
});
