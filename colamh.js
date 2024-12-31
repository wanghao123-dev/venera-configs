class NewComicSource extends ComicSource {  // 首行必须为class...

    // 此漫画源的名称
    name = "漫画本5"

    // 唯一标识符
    key = "colamh"

    version = "1.0.0"

    minAppVersion = "1.0.0"

    // 更新链接
    url = "https://raw.githubusercontent.com/wanghao123-dev/venera-configs/refs/heads/main/colamh.js"

    /// APP启动时或者添加/更新漫画源时执行此函数
    init() {

    }

    /// 账号
    /// 设置为null禁用账号功能
    account = {
        /// 登录
        /// 返回任意值表示登录成功
        login: async (account, pwd) => {
            let res = await Network.post("${this.baseUrl}/api/user/userarr/login", {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "User-Agent": this.webUA
            }, `user=${account}&pass=${pwd}`)

            let data = JSON.parse(res.body)

            if (res.status !== 200) {
                throw "Invalid status code: " + res.status
            } else if (data["code"] !== 0) {
                throw "Invalid response: " + data["msg"]
            } else {
                return 'ok'
            }

        },

        // 退出登录时将会调用此函数
        logout: () => {
            Network.deleteCookies("ymcdnyfqdapp.ikmmh.com")
        },

        registerWebsite: "${this.baseUrl}/user/register/"
    }
    get baseUrl(){
        return `https://www.colamanga.com`
    }

    get webUA() {
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    }

    parseComic(e) {
        let url = e.querySelector("a").attributes['href']
        let title = e.querySelector("a.fed-list-title").text.trim()
        let cover = e.querySelector("a.fed-list-pics").attributes["data-original"]
        let tags =  []
        let description = e.querySelector("span.fed-list-remarks").text.trim()
        return {
            id: url,
            title: title,
            cover: cover,
            tags: tags,
            description: description
        }
    }
    /// 探索页面
    /// 一个漫画源可以有多个探索页面
    explore = [
        {
            /// 标题
            /// 标题同时用作标识符, 不能重复
            title: "漫画本5",

            /// singlePageWithMultiPart 或者 multiPageComicList
            type: "singlePageWithMultiPart",

            load: async () => {
                let res = await Network.get(this.baseUrl, {
                    "User-Agent": this.webUA
                })
                if (res.status !== 200) {
                    throw "Invalid status code: " + res.status
                }
                let document = new HtmlDocument(res.body)
                let parts = document.querySelectorAll("div.fed-list-home")
                let result = {}
                for (let part of parts) {
                    let title = part.querySelector("div.fed-list-head > h2").text.trim()
                    let comics = part.querySelectorAll("ul.fed-list-info > li").map(e => this.parseComic(e))
                    if(comics.length > 0) {
                        result[title] = comics
                    }
                }
                return result
            }
        },
    ]

    /// 分类页面
    /// 一个漫画源只能有一个分类页面, 也可以没有, 设置为null禁用分类页面
    category = {
        /// 标题, 同时为标识符, 不能与其他漫画源的分类页面重复
        title: "漫画本5",
        parts: [
            {
                name: "分类",

                // fixed 或者 random
                // random用于分类数量相当多时, 随机显示其中一部分
                type: "fixed",

                // 如果类型为random, 需要提供此字段, 表示同时显示的数量
                // randomNumber: 5,

                categories: ["全部", "热血", "玄幻", "恋爱", "冒险", "古风", "都市", "穿越", "奇幻", "其他", "搞笑", "少男", "战斗", "重生", "冒险热血", "逆袭", "爆笑", "少年", "后宫", "少女", "系统", "熱血", "动作", "冒險", "校园", "修真", "修仙", "剧情", "大女主", "霸总", "少年热血"],
                categoryParams: ['', '10023', '10024', '10126', '10210', '10143', '10124', '10129', '10242', '10560', '10122', '10641', '10309', '10461', '11224', '10943', '10201', '10321', '10138', '10301', '10722', '12044', '10125', '12123', '10131', '10133', '10453', '10480', '10706', '10127', '12163'],

                // category或者search
                // 如果为category, 点击后将进入分类漫画页面, 使用下方的`categoryComics`加载漫画
                // 如果为search, 将进入搜索页面
                itemType: "category",
            },
            {
                name: "状态",
                type: "fixed",
                categories: ["全部", "连载中", "已完结"],
                itemType: "category",
                categoryParams: ['', '1', '2']
            }
        ],
        enableRankingPage: false,
    }

    /// 分类漫画页面, 即点击分类标签后进入的页面
    categoryComics = {
        load: async (category, param, options, page) => {
            category = encodeURIComponent(category)
            let url = ""
            if (param !== undefined && param !== null) {
                url = `${this.baseUrl}/update/${param}.html`
            } else {
                url = `${this.baseUrl}/booklists/${options[1]}/${category}/${options[0]}/${page}.html`
            }
            let res = await Network.get(url, {
                "User-Agent": this.webUA
            })
            if (res.status !== 200) {
                throw "Invalid status code: " + res.status
            }
            let document = new HtmlDocument(res.body)

            function parseComic(element) {
                let title = element.querySelector("p.title").text
                let cover = element.querySelector("img").attributes["src"]
                let tags = []
                let link = element.querySelector("a").attributes["href"]
                let updateInfo = element.querySelector("span.chapter").text
                return {
                    title: title,
                    cover: cover,
                    tags: tags,
                    id: link,
                    subTitle: updateInfo
                };
            }
            let query = 'ul.comic-sort > li'
            if (param !== undefined && param !== null) {
                query = 'ul.update-list > li'
            }
            let maxPage = null
            return {
                comics: document.querySelectorAll(query).map(parseComic),
                maxPage: maxPage
            }
        },
        // 提供选项
        optionList: [
            {
                // 对于单个选项, 使用-分割, 左侧为用于数据加载的值, 即传给load函数的options参数; 右侧为显示给用户的文本
                options: [
                    "3-全部",
                    "4-连载中",
                    "1-已完结",
                ],
                // 提供[]string, 当分类名称位于此数组中时, 禁用此选项
                notShowWhen: ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
                // 提供[]string, 当分类名称没有位于此数组中时, 禁用此选项
                showWhen: null
            },
            {
                // 对于单个选项, 使用-分割, 左侧为用于数据加载的值, 即传给load函数的options参数; 右侧为显示给用户的文本
                options: [
                    "9-全部",
                    "1-日漫",
                    "2-港台",
                    "3-美漫",
                    "4-国漫",
                    "5-韩漫",
                    "6-未分类"
                ],
                // 提供[]string, 当分类名称位于此数组中时, 禁用此选项
                notShowWhen: ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
                // 提供[]string, 当分类名称没有位于此数组中时, 禁用此选项
                showWhen: null
            },
        ],
    }

    /// 搜索
    search = {
        load: async (keyword, options, page) => {
       
            let res = await Network.get(`${this.baseUrl}/search?searchString=${encodeURIComponent(keyword)}`, {
                "User-Agent": this.webUA
            })
            if (res.status !== 200) {
                throw "Invalid status code: " + res.status
            }
            let document = new HtmlDocument(res.body)

            function parseComic(e) {
                let url = e.querySelector("a").attributes['href']
                let title = e.querySelector("h1 > a").text.trim()
                let cover = e.querySelector("a.fed-list-pics").attributes["data-original"]
                return {
                    id: url,
                    title: title,
                    cover: cover,
                }
            }

            return {
                comics: document.querySelectorAll("div.fed-part-layout > dl").map(parseComic),
                maxPage: 1
            }
        },

        // 提供选项
        optionList: []
    }

    /// 收藏
    favorites = {
        /// 是否为多收藏夹
        multiFolder: false,
        /// 添加或者删除收藏
        addOrDelFavorite: async (comicId, folderId, isAdding) => {
            let id = comicId.split("/")[4]
            if (isAdding) {
                let comicInfoRes = await Network.get(comicId, {
                    "User-Agent": this.webUA
                });
                if (comicInfoRes.status !== 200) {
                    throw "Invalid status code: " + res.status
                }
                let document = new HtmlDocument(comicInfoRes.body)
                let name = document.querySelector("h1").text;
                let res = await Network.post("${this.baseUrl}/api/user/bookcase/add", {
                    "Content-Type": "application/x-www-form-urlencoded",
                }, `articleid=${id}&articlename=${name}`)
                if (res.status !== 200) {
                    throw "Invalid status code: " + res.status
                }
                let json = JSON.parse(res.body)
                if (json["code"] === "0" || json["code"] === 0) {
                    return 'ok'
                } else if (json["code"] === 1) {
                    throw "Login expired"
                } else {
                    throw json["msg"].toString()
                }
            } else {
                let res = await Network.post("${this.baseUrl}/api/user/bookcase/del", {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": this.webUA
                }, `articleid=${id}`)
                if (res.status !== 200) {
                    error("Invalid status code: " + res.status)
                    return;
                }
                let json = JSON.parse(res.body)
                if (json["code"] === "0" || json["code"] === 0) {
                    success("ok")
                } else if (json["code"] === 1) {
                    error("Login expired")
                } else {
                    error(json["msg"].toString())
                }
            }
        },
        /// 加载漫画
        loadComics: async (page, folder) => {
            let res = await Network.post("${this.baseUrl}/api/user/bookcase/ajax", {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": this.webUA
            }, `page=${page}`)
            if (res.status !== 200) {
                throw "Invalid status code: " + res.status
            }
            let json = JSON.parse(res.body)
            if (json["code"] === 1) {
                throw "Login expired"
            }
            if (json["code"] !== "0" && json["code"] !== 0) {
                throw "Invalid response: " + json["code"]
            }
            let comics = json["data"].map(e => {
                return {
                    title: e["name"],
                    subTitle: e["author"],
                    cover: e["cover"],
                    id: "${this.baseUrl}" + e["info_url"]
                }
            })
            let maxPage = json["end"]
            return {
                comics: comics,
                maxPage: maxPage
            }
        }
    }

    /// 单个漫画相关
    comic = {
        // 加载漫画信息
        loadInfo: async (id) => {
            let res = await Network.get(this.baseUrl + id, {
                "User-Agent": this.webUA
            })
            if (res.status !== 200) {
                throw "Invalid status code: " + res.status
            }
            let document = new HtmlDocument(res.body)

            let title = document.querySelector('meta[property="og:comic:book_name"]').attributes["content"]
            let tags = document.querySelector('meta[property="og:comic:category"]').attributes["content"].split(" ")
            let updateTime = document.querySelector('meta[property="og:comic:update_time"]').attributes["content"]
            let description = document.querySelector('meta[property="og:description"]').attributes["content"]
        
            let dataInfo =  document.querySelector('dl.fed-deta-info')
            let cover = dataInfo.querySelector("a.fed-list-pics").attributes["data-original"]

            let allLi = dataInfo.querySelectorAll("dd.fed-deta-content li")
            let authorLi = allLi.find( e =>  e.querySelector('span').textContent == '作者')
            let author =  authorLi ? authorLi.querySelector('a').text : ''
            
            let eps = {}
            let chaData = document.querySelectorAll("div.all_data_list li")
            chaData.forEach((element) => {
                let cha = element.querySelector('a')
                eps[cha.attributes["href"]] = cha.text.trim()
            })
            
            let comics = document.querySelectorAll(".fed-part-layout > ul.fed-list-info > li").map(element => {
                let title = element.querySelector("a.fed-list-title").text
                let cover = element.querySelector("a.fed-list-pics").attributes["data-original"]
                let link = element.querySelector("a.fed-list-title").attributes["href"]
                return {
                    title: title,
                    cover: cover,
                    id: link
                }
            })
            return {
                title: title,
                cover: cover,
                description: description,
                tags: {
                    "作者": [author],
                    "更新": [updateTime],
                    "标签": tags
                },
                chapters: eps,
                recommend: comics
            }
        },
        // 获取章节图片
        loadEp: async (comicId, epId) => {
            console.log(window.mh_info)
            // console.log(comicId');
            // console.log(epId);
            if (comicId.includes("https://")) {
                comicId = comicId.split("/")[4]
            }
            let res = await Network.get(
                `${this.baseUrl}${epId}`,
                {
                    "Referer": `${this.baseUrl}/${comicId}`,
                    "User-Agent": this.webUA
                }
            )
            if (res.status !== 200) {
                throw "Invalid status code: " + res.status
            }
            let document = new HtmlDocument(res.body)
            // console.log(mh_info,'mh_info');
            return {
                images: document.querySelectorAll('div.mh_mangalist > div.mh_comicpic > img').map(e => e.attributes["src"].replace('blob:', ''))
            }
        },
        /// 警告: 这是历史遗留问题, 对于新的漫画源, 不应当使用此字段, 在选取漫画id时, 不应当出现特殊字符
        matchBriefIdRegex: "${this.baseUrl}/book/(\\d+)/"
    }
}
