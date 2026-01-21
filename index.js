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
    if (chuoi.length < 5) {
        return {
            duDoan: "Chưa đủ dữ liệu",
            doTinCay: 50,
            mucDoTinCay: "Thấp"
        };
    }

    const tail = chuoi.slice(-3);

    if (tail === "TTT") {
        return { duDoan: "Xỉu", doTinCay: 78, mucDoTinCay: "Cao" };
    }
    if (tail === "XXX") {
        return { duDoan: "Tài", doTinCay: 78, mucDoTinCay: "Cao" };
    }

    return { duDoan: "Tài/Xỉu ngẫu nhiên", doTinCay: 62, mucDoTinCay: "Trung bình" };
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
