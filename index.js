const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// ====== BIẾN LƯU TRẠNG THÁI (KHÔNG RESET KHI RELOAD WEB) ======
let lastPhien = null;
let chuoiCau = "";
let duDoan = "Chưa có";
let doTinCay = 0;
let mucDoTinCay = "Thấp";

// ====== HÀM DỰ ĐOÁN ĐƠN GIẢN (BẠN CÓ THỂ NÂNG CẤP) ======
function tinhDuDoan(chuoi) {
    const patterns = [
        { name: "1-1", list: ["TXTX", "XTXT"], predict: "Theo cầu", tc: 72 },
        { name: "2-1-2", list: ["TTXTT", "XXTXX"], predict: "Theo cầu", tc: 75 },
        { name: "3-1", list: ["TTTX", "XXXT"], predict: "Đảo 1", tc: 78 },
        { name: "3-1-3", list: ["TTTXTTT", "XXXTXXX"], predict: "Theo cầu", tc: 82 },
        { name: "1-2-4", list: ["TXXTTTT", "XTTXXXX"], predict: "Theo cầu", tc: 85 },
        { name: "Bệt", list: ["TTTTT", "XXXXX"], predict: "Theo bệt", tc: 90 },
        { name: "2-2", list: ["TTXX", "XXTT"], predict: "Theo cầu", tc: 70 },
        { name: "3-3", list: ["TTTXXX", "XXXTTT"], predict: "Theo cầu", tc: 80 },
        { name: "4-4", list: ["TTTTXXXX", "XXXXTTTT"], predict: "Theo cầu", tc: 83 },
        { name: "4-5", list: ["TTTTXXXXX", "XXXXTTTTT"], predict: "Theo cầu", tc: 88 }
    ];

    for (const p of patterns) {
        for (const pat of p.list) {
            if (chuoi.endsWith(pat)) {
                const last = pat[pat.length - 1];
                const duDoan = last === "T" ? "Xỉu" : "Tài";

                return {
                    duDoan: duDoan,
                    doTinCay: p.tc,
                    mucDoTinCay: p.tc >= 85 ? "Rất cao" : p.tc >= 75 ? "Cao" : "Trung bình",
                    tenCau: p.name
                };
            }
        }
    }

    return {
        duDoan: "Chờ dữ liệu",
        doTinCay: 0,
        mucDoTinCay: "Thấp",
        tenCau: "Không xác định"
    };
}


// ====== API ======
app.get("/api/sun", async (req, res) => {
    try {
        const { data } = await axios.get(
            "https://sunwinsaygex-pcl2.onrender.com/api/sun"
        );

        const kyTu = data.ket_qua === "Tài" ? "T" : "X";

        // ====== CHỈ NỐI CHUỖI KHI CÓ PHIÊN MỚI ======
        if (data.phien !== lastPhien) {
            chuoiCau += kyTu;
            lastPhien = data.phien;

            const duLieuDuDoan = tinhDuDoan(chuoiCau);
            duDoan = duLieuDuDoan.duDoan;
            doTinCay = duLieuDuDoan.doTinCay;
            mucDoTinCay = duLieuDuDoan.mucDoTinCay;
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
            du_doan: duDoan,
            do_tin_cay: doTinCay,
            muc_do_tin_cay: mucDoTinCay
        });

    } catch (err) {
        res.status(500).json({ error: "Không lấy được dữ liệu" });
    }
});

app.listen(PORT, () => {
    console.log("API SUN chạy tại port", PORT);
});
