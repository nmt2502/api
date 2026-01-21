const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

/* ================== LOAD DATA ================== */
let lastPhien = null;
let chuoiCau = "";
let win = 0;
let loss = 0;
let duDoanTruoc = null;

if (fs.existsSync(DATA_FILE)) {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    lastPhien = saved.lastPhien;
    chuoiCau = saved.chuoiCau;
    win = saved.win;
    loss = saved.loss;
    duDoanTruoc = saved.duDoanTruoc;
}

/* ================== BIẾN HIỆN TẠI ================== */
let duDoan = "Chưa có";
let doTinCay = 0;
let mucDoTinCay = "Thấp";
let tenCau = "Chưa xác định";

/* ================== SAVE DATA ================== */
function saveData() {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            { lastPhien, chuoiCau, win, loss, duDoanTruoc },
            null,
            2
        )
    );
}

/* ================== THUẬT TOÁN SOI CẦU ================== */
function tinhDuDoan(chuoi) {
    const patterns = [
        { name: "1-1", list: ["TXTX", "XTXT"], tc: 72 },
        { name: "2-1-2", list: ["TTXTT", "XXTXX"], tc: 75 },
        { name: "3-1", list: ["TTTX", "XXXT"], tc: 78 },
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
                    duDoan: last === "T" ? "Xỉu" : "Tài",
                    doTinCay: p.tc,
                    mucDoTinCay:
                        p.tc >= 85 ? "Rất cao" :
                        p.tc >= 75 ? "Cao" : "Trung bình"
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

        const kyTu = data.ket_qua === "Tài" ? "T" : "X";

        if (data.phien !== lastPhien) {

            /* ====== TÍNH WIN / LOSS ====== */
            if (
                duDoanTruoc &&
                duDoanTruoc !== "Chờ thêm dữ liệu" &&
                duDoanTruoc !== "Chưa có"
            ) {
                if (duDoanTruoc === data.ket_qua) win++;
                else loss++;
            }

            /* ====== UPDATE CHUỖI ====== */
            chuoiCau += kyTu;
            lastPhien = data.phien;

            /* ====== DỰ ĐOÁN MỚI ====== */
            const kq = tinhDuDoan(chuoiCau);
            duDoan = kq.duDoan;
            doTinCay = kq.doTinCay;
            mucDoTinCay = kq.mucDoTinCay;
            tenCau = kq.tenCau;

            duDoanTruoc = duDoan;

            saveData(); // 🔒 LƯU NGAY
        }

        res.json({
            phien: data.phien,
            ket_qua: data.ket_qua,
            chuoi_cau: chuoiCau,
            ten_cau: tenCau,
            du_doan: duDoan,
            do_tin_cay: doTinCay,
            muc_do_tin_cay: mucDoTinCay,
            win,
            loss,
            ti_le_thang:
                win + loss > 0
                    ? ((win / (win + loss)) * 100).toFixed(2) + "%"
                    : "0%"
        });

    } catch (e) {
        res.status(500).json({ error: "API lỗi" });
    }
});

/* ================== START ================== */
app.listen(PORT, () => {
    console.log("SUN API chạy tại port", PORT);
});
