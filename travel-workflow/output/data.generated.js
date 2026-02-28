// 2026年春节 海南旅行规划数据 (Version 3.1 - Enhanced Details)

// ------------------------------------------------------------------
// 1. INVENTORY (Entities Database)
// ------------------------------------------------------------------
const inventory = {
    // [LOCATIONS]
    locations: {
        "loc_haikou_meilan_stn": {
            name: "海口美兰站",
            address: "海口美兰国际机场内",
            coords: [110.4600, 19.9400],
            tags: ["Transport", "Train"]
        },
        "loc_wanning_stn": {
            name: "万宁站",
            address: "万宁市万城镇",
            coords: [110.3805, 18.8055],
            tags: ["Transport", "Train"]
        },
        "loc_blossom": {
            name: "万宁花间泊·热浪里海景酒店",
            address: "万宁市日月湾景区内 (G98高速出口南50米)",
            coords: [110.217726, 18.629115], // ModXY (User Verified)
            tags: ["Hotel", "Riyuewan"],
            desc: "2025年全新开业，坐落于日月湾核心区，出门即是浪点。"
        },
        "loc_huangjifu": {
            name: "黄吉芙·糟粕醋火锅 (日月湾店)",
            address: "万宁市日月湾田新村",
            coords: [110.211756, 18.632902], // Updated via AMap Logic near Tianxin
            tags: ["Dining", "Local"] // Keeping simpler coords for now or same as hotel to avoid big jump if not verified, but ~18.63 is safer than 18.55
        },
        "loc_grom": {
            name: "GROM (日月湾店)",
            address: "万宁市日月湾冲浪街",
            coords: [110.217726, 18.629115], // Near Hotel/Surf St
            tags: ["Dining", "Western"]
        },
        "loc_shimei_marina": {
            name: "石梅湾游艇会 (加井岛码头)",
            address: "万宁市石梅湾旅游度假区 (华润石梅湾游艇会)",
            coords: [110.2905, 18.6650],
            tags: ["Activity", "Marina"]
        },
        "loc_niangre": {
            name: "娘惹侨味馆",
            address: "万宁市兴隆镇兴生中路2号",
            coords: [110.1870, 18.7305],
            tags: ["Dining", "Nanyang"]
        },
        "loc_botanical": {
            name: "兴隆热带植物园",
            address: "万宁市兴隆温泉旅游区",
            coords: [110.2010, 18.7420],
            tags: ["Attraction", "Nature"]
        },
        "loc_taiyanghe": {
            name: "太阳河 (桨板点)",
            address: "万宁市太阳河",
            coords: [110.2570, 18.6280],
            tags: ["Activity", "Nature"]
        },
        "loc_riyue_flower": {
            name: "万宁花间泊·热浪里海景酒店",
            address: "日月湾旅游度假区",
            coords: [110.217726, 18.629115], // ModXY (User Provided) to fix water issue
            tags: ["Hotel", "Stay"]
        },
        "loc_1_hotel": {
            name: "三亚海棠湾阳光壹酒店",
            address: "三亚市海棠区海棠南路4号",
            coords: [109.722220, 18.297058], // Precision AMap
            tags: ["Hotel", "Luxury", "Eco"],
            desc: "主打可持续发展的奢华酒店，拥有著名的悬浮透明泳池。"
        },
        "loc_linjie": {
            name: "林姐香味海鲜 (海棠店)",
            address: "三亚市海棠北路68号环球美食城",
            coords: [109.7460, 18.3000],
            tags: ["Dining", "Seafood"]
        },
        "loc_cdf": {
            name: "三亚国际免税城",
            address: "三亚市海棠区海棠北路118号",
            coords: [109.7538, 18.3735],
            tags: ["Shopping"]
        },
        "loc_atlantis": {
            name: "三亚·亚特兰蒂斯",
            address: "三亚市海棠区海棠北路36号",
            coords: [109.7533, 18.3351],
            tags: ["Attraction", "Hotel"]
        },
        "loc_atlantis_royal": {
            name: "亚特兰蒂斯·皇家俱乐部",
            address: "三亚市海棠区海棠北路36号",
            coords: [109.7533, 18.3351],
            tags: ["Hotel", "VIP"],
            desc: "享受皇家俱乐部专属权益，包括行政酒廊待遇、免费无限次畅玩水世界水族馆。"
        },
        "loc_airport_syx": {
            name: "三亚凤凰国际机场",
            address: "三亚市天涯区凤凰路",
            coords: [109.4124, 18.3039],
            tags: ["Transport", "Airport"]
        },
        "loc_216_bar": {
            name: "216 Beach Club (海景酒吧)",
            address: "日月湾国家冲浪训练基地",
            coords: [110.220492, 18.629744],
            tags: ["Dining", "Bar", "Nightlife"]
        },
        // [New Candidate Locations]
        "loc_shimei_laozhai": {
            name: "老窄巷正宗糟粕醋火锅 (石梅湾店)",
            address: "万宁市石梅湾",
            coords: [110.289442, 18.669254],
            tags: ["Dining", "Local"]
        },
        "loc_riyue_qiongzhou": {
            name: "琼州糟粕醋·海南酸汤火锅 (日月湾店)",
            address: "万宁市日月湾",
            coords: [110.214332, 18.626410],
            tags: ["Dining", "Local"]
        },
        "loc_shimei_fangjie": {
            name: "芳姐陵水酸粉",
            address: "万宁市石梅湾",
            coords: [110.266944, 18.666736],
            tags: ["Dining", "Local"]
        },
        "loc_riyue_wanliren": {
            name: "湾里人清补凉",
            address: "万宁市日月湾",
            coords: [110.213680, 18.641533],
            tags: ["Dining", "Dessert"]
        },
        "loc_shimei_cashcow": {
            name: "CASHCOW 西餐俱乐部",
            address: "万宁市石梅湾",
            coords: [110.269721, 18.661732],
            tags: ["Dining", "Western"]
        },
        "loc_wuzhizhou": {
            name: "蜈支洲岛",
            address: "三亚市海棠区林旺镇后海村",
            coords: [109.761806, 18.312133],
            tags: ["Attraction", "Island"]
        }
    },

    // [ITEMS] Preparation list
    items: {
        "item_id": { name: "身份证/驾照", icon: "fa-id-card", note: "租车入住必备" },
        "item_protein": { name: "能量棒/零食", icon: "fa-cookie-bite", note: "随时补充体力" },
        "item_coffee": { name: "挂耳咖啡", icon: "fa-mug-hot", note: "消肿提神" },
        "item_sunscreen": { name: "高倍防晒", icon: "fa-sun", note: "Zinka 冲浪泥" },
        "item_swimwear": { name: "泳衣/水母衣", icon: "fa-water", note: "冲浪必备" },
        "item_camera": { name: "GoPro/相机", icon: "fa-camera", note: "记录大片" },
        "item_app": { name: "离岛免税APP", icon: "fa-mobile-screen", note: "提前注册" },
        "item_mosquito": { name: "驱蚊水", icon: "fa-spray-can", note: "热带雨林必备" },
        "item_waterproof_bag": { name: "手机防水袋", icon: "fa-mobile", note: "玩水拍照" },
        "item_slippers": { name: "舒适拖鞋", icon: "fa-shoe-prints", note: "沙滩漫步" },
        "item_hat": { name: "遮阳帽/墨镜", icon: "fa-hat-cowboy", note: "物理防晒" },
        "item_charger": { name: "充电宝", icon: "fa-battery-full", note: "电量焦虑" }
    },

    // [DINING]
    dining: {

        "din_grom": {
            name: "GROM 手工汉堡",
            type: "西餐/汉堡",
            price: 100,
            locationId: "loc_grom",
            tips: "肉汁丰富，面包松软。",
            img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd"
        },
        "din_niangre": {
            name: "娘惹侨味馆",
            type: "南洋菜",
            price: 80,
            locationId: "loc_niangre",
            tips: "必点咖喱鸡，斑兰糕。",
            img: "https://images.unsplash.com/photo-1549488391-49b4be16a3c5"
        },
        "din_dongshanyang": {
            name: "兴隆东山羊",
            type: "滋补火锅",
            price: 180,
            locationId: "loc_botanical",
            tips: "肉质鲜美，汤底滋补。"
        },
        "din_linjie": {
            name: "林姐香味海鲜",
            type: "海鲜加工",
            price: 200,
            locationId: "loc_linjie",
            tips: "香辣蟹、皮皮虾。",
            img: "https://images.unsplash.com/photo-1559742811-822873691df8"
        },
        "din_coconut_chicken": {
            name: "嗲嗲的椰子鸡 (海棠湾店)",
            type: "清润火锅",
            price: 150,
            locationId: "loc_linjie", // Nearby usually
            tips: "必点三个椰子文昌鸡，清甜补水，低卡健康。",
            img: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43"
        },
        "din_xinglong_coffee": {
            name: "兴隆老南洋咖啡简餐",
            type: "轻食/下午茶",
            price: 60,
            locationId: "loc_niangre", // Same area
            tips: "推荐老盐咖啡消肿，搭配低糖斑兰糕。"
        },
        "din_1kitchen": {
            name: "1 Kitchen (壹厨房)",
            type: "有机西餐",
            price: 400,
            locationId: "loc_1_hotel",
            tips: "慢烤M5和牛、海钓鱼。",
            img: "https://images.unsplash.com/photo-1559339352-11d035aa65de"
        },
        "din_royal_lounge": {
            name: "皇家俱乐部 Happy Hour",
            type: "自助轻食",
            price: 0,
            locationId: "loc_atlantis_royal",
            tips: "酒水畅饮，精致小食。",
            img: "https://images.unsplash.com/photo-1514362545857-3bc16549766b"
        },
        "din_nanyang": {
            name: "南洋风味 (老店)",
            type: "传统南洋菜",
            price: 70,
            locationId: "loc_niangre",
            tips: "咖喱鱼丸、斑兰糕。",
            img: "https://images.unsplash.com/photo-1513442542250-854d436a73f2"
        },
        "din_rongxin": {
            name: "荣鑫桑拿菜",
            type: "清淡蒸锅",
            price: 120,
            locationId: "loc_botanical",
            tips: "蒸海鲜、蒸鸡，保留原汁原味。",
            img: "https://images.unsplash.com/photo-1585325701165-351af916e581"
        },
        "din_68_seafood": {
            name: "68环球美食街 (达叔海鲜)",
            type: "海鲜大排档",
            price: 180,
            locationId: "loc_linjie",
            tips: "热闹接地气，海鲜新鲜。",
            img: "https://images.unsplash.com/photo-1626804475297-411dbe631fc8"
        },
        "din_xiyue": {
            name: "喜粤8号 (CDF店)",
            type: "粤菜点心",
            price: 150,
            locationId: "loc_cdf",
            tips: "米其林出品，虾饺、红米肠。",
            img: "https://images.unsplash.com/photo-1563245372-f21724e3856d"
        },
        "din_yexiaoji": {
            name: "椰小鸡·椰子鸡",
            type: "椰子鸡火锅",
            price: 140,
            locationId: "loc_cdf",
            tips: "王思聪同款，口味偏甜。",
            img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec"
        },
        "din_edition_bbq": {
            name: "EDITION Beach Barbacoa",
            type: "沙滩烧烤",
            price: 500,
            locationId: "loc_1_hotel",
            tips: "浪漫氛围，海鲜烧烤。",
            img: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7"
        },
        "din_laozhaixiang": {
            name: "老窄巷正宗糟粕醋",
            type: "糟粕醋火锅",
            price: 110,
            locationId: "loc_shimei_laozhai",
            tips: "石梅湾人气老店，汤底浓郁。",
            img: "https://images.unsplash.com/photo-1547592180-85f173990554"
        },
        "din_qiongzhou": {
            name: "琼州糟粕醋 (日月湾店)",
            type: "酸汤火锅",
            price: 120,
            locationId: "loc_riyue_qiongzhou",
            tips: "日月湾排队王，海鲜新鲜。",
            img: "https://images.unsplash.com/photo-1596796120464-325bdfa9582d"
        },
        "din_fangjie": {
            name: "芳姐陵水酸粉",
            type: "特色小吃",
            price: 25,
            locationId: "loc_shimei_fangjie",
            tips: "酸辣开胃，地道陵水风味。",
            img: "https://images.unsplash.com/photo-1555126634-323283e090fa"
        },
        "din_wanliren": {
            name: "湾里人清补凉",
            type: "甜品/清补凉",
            price: 20,
            locationId: "loc_riyue_wanliren",
            tips: "椰奶浓郁，料足解暑。",
            img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb"
        },
        "din_cashcow": {
            name: "CASHCOW 西餐俱乐部",
            type: "西餐/轻食",
            price: 140,
            locationId: "loc_shimei_cashcow",
            tips: "环境优美，适合Brunch和拍照。",
            img: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0"
        },
        "din_216": {
            name: "216 Beach Club",
            type: "海景酒吧/西餐",
            price: 180,
            locationId: "loc_216_bar",
            tips: "最佳海上落日观赏点，晚上有乐队驻唱。",
            img: "http://store.is.autonavi.com/showpic/d6f02cff9fc83719c5166be27c3199cb"
        }
    },

    // [ACTIVITIES]
    activities: {
        "act_sailing": {
            name: "加井岛双体帆船",
            price: 580,
            locationId: "loc_shimei_marina",
            desc: "双体帆船出海，享受玻璃海浮潜。",
            img: "https://images.unsplash.com/photo-1534447677768-be436bb09401",
            packageInfo: [
                "时长：3小时 (含往返船程)",
                "项目：不限时浮潜、水上魔毯、网红玻璃船",
                "餐饮：包含热带水果盘、饮用水、精致点心",
                "服务：提供浮潜面镜呼吸管 (建议近视超过300度自备隐形)",
                "赠送：无人机航拍视频 (商家视天气赠送)"
            ],
            precautions: [
                "建议提前30分钟到达石梅湾游艇会码头。",
                "晕船者请提前半小时服用晕船药。",
                "患有心脏病、高血压或孕妇不宜参加。",
                "自备泳衣、浴巾及防晒用品。"
            ]
        },
        "act_sup": {
            name: "太阳河桨板 (SUP)",
            price: 328,
            locationId: "loc_taiyanghe",
            desc: "穿梭于热带雨林与椰林之间的静水桨板体验。",
            img: "https://images.unsplash.com/photo-1596489394627-2fa9425514f7",
            packageInfo: [
                "时长：约2小时",
                "包含：全套桨板装备、救生衣、教练基础指导",
                "特色：雨林航拍，适合拍摄背影大片"
            ],
            precautions: [
                "落水概率较低，但建议穿着快干衣物。",
                "建议携带手机防水袋。",
                "注意保护生态环境，随身带走垃圾。"
            ]
        },
        "act_surfing": {
            name: "冲浪私教课 (1对1)",
            price: 450,
            locationId: "loc_blossom",
            desc: "专业教练1对1指导，零基础也能站立冲浪。",
            img: "https://images.unsplash.com/photo-1502680390469-be75c86b636f",
            packageInfo: [
                "时长：90-120分钟",
                "教学：岸上理论 + 水下实操 (抓浪、站板)",
                "装备：提供长袖防磨服、冲浪板、防晒泥",
                "影像：赠送Gopro冲浪照片/视频"
            ],
            precautions: [
                "需提前修剪指甲，取下首饰。",
                "近视者必须佩戴隐形眼镜。",
                "课前1小时请勿过饱饮食。",
                "涂抹彩色防晒泥 (Zinka) 既防晒又出片。"
            ]
        },
        "act_botanical": {
            name: "兴隆热带植物园",
            price: 50,
            locationId: "loc_botanical",
            desc: "漫步热带雨林，品尝新鲜可可和咖啡。",
            img: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6",
            packageInfo: [
                "门票：含园区游览",
                "推荐体验：现磨兴隆咖啡、制作巧克力 (需另付费)"
            ],
            precautions: [
                "午后蚊虫较多，必备驱蚊水。",
                "园区较大，建议穿着舒适的走路鞋。"
            ]
        },
        "act_waterpark": {
            name: "亚特兰蒂斯水世界",
            price: 0,
            locationId: "loc_atlantis",
            desc: "全年开放的水上乐园，体验惊险刺激的滑道。",
            img: "https://images.unsplash.com/photo-1582653288634-4094911029c3",
            packageInfo: [
                "权益：住店客人无限次刷脸入园",
                "必玩：海神之跃 (垂直滑道)、放手一搏、鲨鱼穿越",
                "注意：皇家俱乐部权益通常不包含免排队快速通道 (需另购)"
            ],
            precautions: [
                "不可携带食物和饮料入园 (婴儿食品除外)。",
                "建议自备涉水鞋，地面可能会很烫。",
                "部分刺激项目有体重和身高限制，游玩前请确认。"
            ]
        },
        "act_aquarium": {
            name: "失落的空间水族馆",
            price: 0,
            locationId: "loc_atlantis",
            desc: "观赏86000尾海洋生物，探索亚特兰蒂斯神话。",
            img: "https://images.unsplash.com/photo-1520627967912-14c2b9a19454",
            packageInfo: [
                "权益：住店客人无限次刷脸入园",
                "特色：白鲸互动、大使环礁湖喂食秀"
            ],
            precautions: [
                "推荐17:00后入园，避开旅行团高峰。",
                "禁止使用闪光灯拍摄，以免惊吓鱼类。"
            ]
        },
        "act_shopping": {
            name: "三亚国际免税城",
            price: 0,
            locationId: "loc_cdf",
            desc: "全球最大单体免税店，品牌齐全。",
            img: "https://images.unsplash.com/photo-1607082352121-fa243f3dd32d",
            packageInfo: [
                "区域：A区主打美妆/奢侈品，B区主打珠宝/腕表"
            ],
            precautions: [
                "需提供离岛机票/火车票信息。",
                "建议提前下载APP注册会员，累积积分抵现。",
                "部分热门品牌 (如香奈儿、爱马仕) 需排队。"
            ]
        },
        "act_pool": {
            name: "悬浮泳池打卡",
            price: 0,
            locationId: "loc_1_hotel",
            desc: "1 Hotel 标志性透明悬浮泳池，全网爆火打卡点。",
            img: "https://images.unsplash.com/photo-1596726955365-1d6e16a20d66",
            precautions: [
                "仅限住店客人使用。",
                "最佳拍摄时间为上午9:00-10:00，光线柔和且人少。"
            ]
        },
        "act_spa": {
            name: "Bamford Wellness SPA",
            price: 1280,
            locationId: "loc_1_hotel",
            desc: "源自英国的奢华有机SPA，在海浪声中放松身心。",
            img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874",
            packageInfo: [
                "时长：60分钟",
                "项目：深层组织按摩 / 舒缓芳香疗法",
                "包含：独立淋浴、有机茶点、私人休息区"
            ],
            precautions: [
                "需提前24小时预约。",
                "建议提前30分钟抵达，享受桑拿和蒸汽浴。",
                "避免空腹或过饱时进行。"
            ]
        },
        "act_wuzhizhou": {
            name: "蜈支洲岛 (Plus)",
            price: 1399,
            locationId: "loc_wuzhizhou",
            desc: "中国马尔代夫，水质清澈，潜水胜地。(Day 2 备选方案)",
            img: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b",
            packageInfo: [
                "时长：全天 (09:00 - 17:00)",
                "推荐：极限玩家套票 (含潜水、动感飞艇、摩托艇等)",
                "如果不玩项目，仅门船票约 144元/人"
            ],
            precautions: [
                "如启用此备选，需放弃 Day 4 的CDF免税店行程。",
                "岛上物价较高，建议自备干粮和水。",
                "最后一班离岛船通常为 17:30。"
            ]
        }
    }
};

// ------------------------------------------------------------------
// 2. ITINERARY (Schedule References)
// ------------------------------------------------------------------
const itinerary = [
    {
        day: 1,
        date: "2026-02-21",
        loc: "万宁",
        weather: "25°C 🌤️",
        stay: "loc_blossom",
        preparation: ["item_id", "item_protein", "item_hat", "item_charger"],
        schedule: [
            {
                time: "17:00",
                type: "transport",
                title: "抵达海口美兰",
                desc: "抵达 T2 航站楼，步行前往高铁站。",
                refId: "loc_haikou_meilan_stn"
            },
            {
                time: "20:00",
                type: "transport",
                title: "抵达万宁日月湾",
                desc: "万宁站打车前往日月湾 (约40元)。",
                refId: "loc_blossom"
            },
            {
                time: "20:30",
                type: "dining",
                title: "美味开胃晚餐",
                isChoice: true,
                default: "din_qiongzhou",
                options: ["din_qiongzhou", "din_grom", "din_216"]
            }
        ]
    },
    {
        day: 2,
        date: "2026-02-22",
        loc: "万宁",
        weather: "26°C ☀️",
        stay: "loc_blossom",
        preparation: ["item_sunscreen", "item_camera", "item_swimwear", "item_mosquito", "item_waterproof_bag"],
        schedule: [
            {
                time: "09:30",
                type: "activity",
                refId: "act_sailing",
                title: "加井岛帆船出海 (备选: 蜈支洲)"
            },
            {
                time: "13:00",
                type: "dining",
                title: "南洋风味午餐",
                isChoice: true,
                default: "din_nanyang",
                options: ["din_nanyang", "din_niangre"]
            },
            {
                time: "14:30",
                type: "activity",
                refId: "act_botanical",
                title: "植物园黑咖啡消肿"
            },
            {
                time: "18:30",
                type: "dining",
                title: "东山羊滋补晚餐",
                isChoice: true,
                default: "din_dongshanyang",
                options: ["din_dongshanyang", "din_rongxin"]
            }
        ]
    },
    {
        day: 3,
        date: "2026-02-23",
        loc: "万宁 -> 三亚",
        weather: "26°C 🌥️",
        stay: "loc_1_hotel",
        preparation: ["item_swimwear", "item_sunscreen", "item_slippers"],
        schedule: [
            {
                time: "09:30",
                type: "activity",
                refId: "act_sup",
                title: "太阳河桨板 (SUP)"
            },
            {
                time: "12:30",
                type: "dining",
                refId: "din_xinglong_coffee",
                title: "老南洋咖啡简餐"
            },
            {
                time: "14:30",
                type: "activity",
                refId: "act_surfing",
                title: "日月湾冲浪私教"
            },
            {
                time: "18:30",
                type: "transport",
                title: "转场三亚海棠湾",
                desc: "整理行李退房，包车前往三亚 (约1小时)。",
                refId: "loc_1_hotel"
            },
            {
                time: "20:00",
                type: "dining",
                title: "海棠湾海鲜晚餐",
                isChoice: true,
                default: "din_linjie",
                options: ["din_linjie", "din_68_seafood"]
            },
            {
                time: "21:30",
                type: "activity",
                title: "艾迪逊 (EDITION) 观海",
                desc: "支线任务：步行至隔壁艾迪逊酒店，打卡星空吧或私人海域栈道。",
                isSideQuest: true,
                refId: "loc_1_hotel"
            }
        ]
    },
    {
        day: 4,
        date: "2026-02-24",
        loc: "三亚",
        weather: "27°C ☀️",
        stay: "loc_1_hotel",
        preparation: ["item_app", "item_camera"],
        schedule: [
            {
                time: "09:00",
                type: "activity",
                title: "Day 4 白天安排",
                isChoice: true,
                default: "act_pool",
                options: ["act_pool", "act_wuzhizhou"]
            },
            {
                time: "12:00",
                type: "dining",
                title: "午餐 (若在岛上则自理)",
                isChoice: true,
                default: "din_xiyue",
                options: ["din_xiyue", "din_yexiaoji"]
            },
            {
                time: "14:30",
                type: "activity",
                refId: "act_shopping",
                title: "CDF 免税店血拼 (Option A)"
            },
            {
                time: "17:30",
                type: "activity",
                refId: "act_spa",
                title: "酒店 SPA 放松"
            },
            {
                time: "19:00",
                type: "activity",
                title: "保利瑰丽 (Rosewood) 天际线",
                desc: "支线任务：打车前往瑰丽酒店 13F 空中大堂，俯瞰海棠湾全景。",
                isSideQuest: true,
                refId: "loc_cdf"
            },
            {
                time: "20:00",
                type: "dining",
                title: "浪漫有机晚餐",
                isChoice: true,
                default: "din_1kitchen",
                options: ["din_1kitchen", "din_edition_bbq"]
            }
        ]
    },
    {
        day: 5,
        date: "2026-02-25",
        loc: "三亚",
        weather: "27°C ☀️",
        stay: "loc_atlantis_royal",
        preparation: ["item_swimwear", "item_id"],
        schedule: [
            {
                time: "10:00",
                type: "transport",
                title: "VIP 皇家俱乐部入住",
                desc: "前往亚特兰蒂斯，办理皇家俱乐部专属入住。",
                refId: "loc_atlantis_royal"
            },
            {
                time: "12:30",
                type: "dining",
                title: "园区午餐简食",
                desc: "推荐：鲨鱼之春餐厅 (快餐) 或 BS Kitchen (需出园)",
                isChoice: false,
                refId: "loc_atlantis",
                price: 100
            },
            {
                time: "16:00",
                type: "dining",
                title: "客房下午茶 (Delivery)",
                desc: "皇家俱乐部礼遇：提前致电管家送到房间，阳台看海享用。",
                isChoice: false,
                refId: "loc_atlantis_royal",
                price: 0
            },
            {
                time: "19:00",
                type: "dining",
                refId: "din_royal_lounge",
                title: "酒廊 Happy Hour"
            },
            {
                time: "20:30",
                type: "activity",
                refId: "act_aquarium",
                title: "夜游水族馆"
            }
        ]
    },
    {
        day: 6,
        date: "2026-02-26",
        loc: "返程",
        weather: "26°C ✈️",
        stay: null,
        preparation: ["item_id"],
        schedule: [
            {
                time: "12:00",
                type: "transport",
                title: "退房送机",
                desc: "专车前往三亚凤凰机场。",
                refId: "loc_airport_syx"
            }
        ]
    }
];

// Exposure
window.travelData = {
    meta: {
        title: "",
        travelers: 2,
        baseSettings: {
            diningBudget: 600, // per day per person
            transportBudget: 1500, // total
            hotelTotal: 11467 // Blossom*2 + 1Hotel*2 + Atlantis*1
        }
    },
    inventory,
    itinerary
};
