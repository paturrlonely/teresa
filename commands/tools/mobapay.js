import axios from "axios";

const handler = async (m, {
    args
}) => {
    if (args.length < 2)
        return m.reply("Gunakan:\n.mobapay <uid> <zone>");

    const [uid, zone] = args;

    let data;
    try {
        const res = await axios.get(
            "https://api.mobapay.com/api/app_shop", {
                headers: {
                    "content-type": "application/json",
                    "user-agent": "WhatsApp-Bot"
                },
                params: {
                    app_id: 100000,
                    game_user_key: uid,
                    game_server_key: zone,
                    country: "ID",
                    language: "en",
                    shop_id: 1001
                },
                timeout: 15000
            }
        );

        data = res.data;
    } catch (e) {
        return m.reply("❌ Gagal mengambil data Mobapay");
    }

    const shop = data?.data?.shop_info;
    const user = data?.data?.user_info;

    if (!shop || !user)
        return m.reply("❌ Data Mobapay tidak valid");

    const parseGoods = goods =>
        goods
        .filter(
            item =>
            item.label &&
            item.label.caption === "首充商品角标"
        )
        .map(item => ({
            title: item.title,
            available: !item.goods_limit?.reached_limit
        }));

    const firstRecharge = [
        ...parseGoods(shop.good_list || []),
        ...parseGoods(
            shop.shelf_location?.[0]?.goods || []
        )
    ];

    if (!firstRecharge.length)
        return m.reply("❌ First recharge tidak ditemukan");

    const list = firstRecharge
        .map(
            (v, i) =>
            `${i + 1}. ${v.title}\n   Status: ${
                    v.available ? "✅ Tersedia" : "❌ Sudah dibeli"
                }`
        )
        .join("\n\n");

    const text = `
◦❒ *MOBAPAY CHECK*

◦❒ Username: ${user.user_name}
◦❒ UID: ${uid}
◦❒ Zone: ${zone}

◦❒ *First Recharge:*
${list}
`.trim();

    m.reply(text);
};

handler.help = ["mobapay <uid> <zone>"];
handler.tags = ["tools"];
handler.command = /^mobapay$/i;
handler.description = "Cek status first recharge Mobapay";

export default handler;