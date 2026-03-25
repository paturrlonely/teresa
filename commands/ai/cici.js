let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    try {
        if (!text) {
            return m.reply(`*Contoh Penggunaan:* ${usedPrefix + command} Apa itu kecerdasan buatan?`);
        };

        await conn.sendMessage(m.chat, {
            react: {
                text: '⏳',
                key: m.key
            }
        });

        const rnd = () => Math.floor(Math.random() * 100000000000000000) + 1;
        const rndHex = () => Math.floor(Math.random() * 100000000000000000).toString(16);
        const randomStr = () => Math.random().toString(36).substring(7);

        const random = rnd();
        const cdid = '2' + rndHex().padStart(23, '0');
        const uid = rnd();
        const iid = rnd();
        const device_id = rnd();

        const response = await fetch('https://api-normal-i18n.ciciai.com/im/sse/send/message?flow_im_arch=v2&device_platform=android&os=android&ssmix=a&_rticket=' + random + '&cdid=' + cdid + '&channel=googleplay&aid=489823&app_name=nova_ai&version_code=' + (Math.floor(Math.random() * 1000000) + 1) + '&version_name=' + randomStr() + '&manifest_version_code=' + (Math.floor(Math.random() * 1000000) + 1) + '&update_version_code=' + (Math.floor(Math.random() * 1000000) + 1) + '&resolution=' + (Math.floor(Math.random() * 1000) + 1) + 'x' + (Math.floor(Math.random() * 1000) + 1) + '&dpi=' + (Math.floor(Math.random() * 1000) + 1) + '&device_type=' + randomStr() + '&device_brand=' + randomStr() + '&language=en&os_api=' + (Math.floor(Math.random() * 100) + 1) + '&os_version=' + randomStr() + '&ac=wifi&uid=' + uid + '&carrier_region=ID&sys_region=US&tz_name=Asia/Shanghai&is_new_user=1&region=US&lang=en&pkg_type=release_version&iid=' + iid + '&device_id=' + device_id + '&flow_sdk_version=' + (Math.floor(Math.random() * 1000000) + 1) + '&use-olympus-account=1', {
            method: 'POST',
            headers: {
                'Accept-Encoding': 'gzip',
                'Connection': 'Keep-Alive',
                'Content-Type': 'application/json; encoding=utf-8',
                'Host': 'api-normal-i18n.ciciai.com',
                'passport-sdk-version': '505174',
                'req_biz_id': 'Message',
                'sdk-version': '2',
                'User-Agent': 'com.larus.wolf/8090004 (Linux; U; Android 12; en_US; SM-S9180; Build/PQ3B.190801.10101846;tt-ok/3.12.13.18)',
                'x-tt-store-region': 'id',
                'x-tt-store-region-src': 'uid',
                'X-Tt-Token': '0329aceacb51f4b2d468e8709307dcc44604a72f48ba71143b3403209f8f98cf37f4111f4fe8bac693d57dd0580c0e13a32d8d230813a3064feaf53b9d8fd9e5ae0256d50c4b29427687873645bd92d3b842a-1.0.0'
            },
            body: JSON.stringify({
                channel: 3,
                cmd: 100,
                sequence_id: crypto.randomUUID(),
                uplink_body: {
                    send_message_body: {
                        ack_only: false,
                        applet_payload: {},
                        bot_id: '7241547611541340167',
                        bot_type: 1,
                        client_controller_param: {
                            answer_with_suggest: true,
                            local_language_code: 'en',
                            local_nickname: 'Randy yuann',
                            local_voice_id: '92'
                        },
                        content: JSON.stringify({
                            im_cmd: -1,
                            text: text
                        }),
                        content_type: 1,
                        conversation_id: '485805516280081',
                        conversation_type: 3,
                        create_time: Math.floor(Date.now() / 1000),
                        ext: {
                            create_time_ms: Date.now().toString(),
                            record_status: '1',
                            wiki: '1',
                            search_engine_type: '1',
                            media_search_type: '0',
                            answer_with_suggest: '1',
                            system_language: 'en',
                            enter_method_trace: '',
                            previous_page_trace: '',
                            is_audio: 'false',
                            voice_mix_input: '0',
                            tts: '1',
                            ugc_plugin_auth_infos: '[]',
                            is_app_background: '0',
                            is_douyin_installed: '0',
                            is_luna_installed: '0',
                            media_player_business_scene: '',
                            need_deep_think: '0',
                            need_net_search: '0',
                            send_message_scene: 'keyboard'
                        },
                        client_fallback_param: {
                            last_section_id: '',
                            last_message_index: -1
                        },
                        local_message_id: rndHex(),
                        sender_id: '7584067883349640200',
                        status: 0,
                        unique_key: rndHex()
                    }
                },
                version: '1'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        };

        const rawData = await response.text();
        const sources = [];
        const dataRegex = /data:\s*(\{.*?\})(?=\n\s*id:|\n*$)/gs;
        let match;

        while ((match = dataRegex.exec(rawData)) !== null) {
            try {
                const json = JSON.parse(match[1]);
                const body = json?.downlink_body?.fetch_chunk_message_downlink_body;
                if (!body) continue;

                const contentObj = JSON.parse(body.content);
                const tags = contentObj?.text_tags || [];

                tags.forEach(tag => {
                    const tagInfo = JSON.parse(tag.tag_info);
                    if (tagInfo.url && tagInfo.title) {
                        sources.push({
                            url: tagInfo.url,
                            title: tagInfo.title
                        });
                    };
                });
            } catch {
                continue;
            };
        };

        const originRegex = /"origin_content"\s*:\s*"([^"]*)"/g;
        const result = [];
        while ((match = originRegex.exec(rawData)) !== null) {
            result.push(match[1]);
        };

        const chatResult = result.join('');
        let replyText = `*🤖 Cici AI Says:*\n${chatResult}`;
        if (sources.length > 0) {
            replyText += `\n\n*📚 Referensi:*\n`;
            replyText += sources.map(src => `• [${src.title}](${src.url})`).join('\n');
        };

        await m.reply(replyText);

    } catch (error) {
        console.error(error);
        await m.reply(`*🍂 Gagal!* Permintaan ke Cici AI gagal. Silakan coba lagi nanti.`);
    } finally {
        await conn.sendMessage(m.chat, {
            react: {
                text: '',
                key: m.key
            }
        });
    };
};

handler.help = ['cici'];
handler.tags = ['ai'];
handler.command = /^(cici)$/i;
handler.limit = true;
handler.register = false;

export default handler;