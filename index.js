const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

/* ================== BIẾN LƯU TRẠNG THÁI ================== */
let lastPhien = null;
let chuoiCau = "";
let duDoan = "Chưa có";
let doTinCay = 0;
let mucDoTinCay = "Thấp";
let tenCau = "Chưa xác định";

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
                const duDoan = last === "T" ? "Xỉu" : "Tài";

                return {
                    tenCau: p.name,
                    duDoan,
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

/* ================== API SUN ================== */
app.get("/api/sun", async (req, res) => {
    try {
        const { data } = await axios.get(
            "https://sunwinsaygex-pcl2.onrender.com/api/sun"
        );

        const kyTu = data.ket_qua === "Tài" ? "T" : "X";

        // Chỉ nối chuỗi khi có phiên mới
        if (data.phien !== lastPhien) {
            chuoiCau += kyTu;
            lastPhien = data.phien;

            const kq = tinhDuDoan(chuoiCau);
            duDoan = kq.duDoan;
            doTinCay = kq.doTinCay;
            mucDoTinCay = kq.mucDoTinCay;
            tenCau = kq.tenCau;
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
            muc_do_tin_cay: mucDoTinCay
        });

    } catch (err) {
        res.status(500).json({
            error: "Không lấy được dữ liệu API gốc"
        });
    }
});

/* ================== START SERVER ================== */
app.listen(PORT, () => {
    console.log("SUN API chạy tại port", PORT);
});
