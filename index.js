const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

/* ================== BIẾN TRẠNG THÁI ================== */
let lastPhien = null;
let chuoiCau = "";

let duDoan = "Chưa có";
let doTinCay = 0;
let mucDoTinCay = "Thấp";
let tenCau = "Chưa xác định";

// thống kê
let win = 0;
let loss = 0;

// lưu dự đoán phiên trước
let duDoanTruoc = null;

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

            /* ====== SO KẾT QUẢ DỰ ĐOÁN PHIÊN TRƯỚC ====== */
            if (
                duDoanTruoc &&
                duDoanTruoc !== "Chờ thêm dữ liệu" &&
                duDoanTruoc !== "Chưa có"
            ) {
                if (duDoanTruoc === data.ket_qua) {
                    win++;
                } else {
                    loss++;
                }
            }

            /* ====== NỐI CHUỖI CẦU ====== */
            chuoiCau += kyTu;
            lastPhien = data.phien;

            /* ====== TÍNH DỰ ĐOÁN MỚI ====== */
            const kq = tinhDuDoan(chuoiCau);
            duDoan = kq.duDoan;
            doTinCay = kq.doTinCay;
            mucDoTinCay = kq.mucDoTinCay;
            tenCau = kq.tenCau;

            // lưu dự đoán cho phiên kế tiếp
            duDoanTruoc = duDoan;
        }

        res.json({
            phien: data.phien,
            xuc_xac_1: data.xuc_xac_1,
            xuc_xac_2: data.xuc_xac_2,
            xuc_xac_3: data.xuc_xac_3,
            tong: data.tong,
            ket_qua: data.ket_qua,
            phien_hien_tai: data.phien_hien_tai,

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

    } catch (err) {
        res.status(500).json({ error: "Không lấy được dữ liệu API gốc" });
    }
});

/* ================== START ================== */
app.listen(PORT, () => {
    console.log("SUN API chạy tại port", PORT);
});
