const SVG = d3.select("svg");
const COUNTY_ID_TABLE = [
    "",
    "G", // 宜蘭
    "N", // 彰化
    "M", // 南投
    "P", // 雲林
    "C", // 基隆
    "A", // 台北
    "F", // 新北
    "B", // 台中
    "D", // 台南
    "H", // 桃園
    "K", // 苗栗
    "I", // 嘉義市
    "Q", // 嘉義縣
    "W", // 金門
    "E", // 高雄
    "V", // 台東
    "U", // 花蓮
    "X", // 澎湖
    "O", // 新竹市
    "J", // 新竹縣
    "T", // 屏東
    // Z: 連江
];

const TW_MAP_URL =
    "https://raw.githubusercontent.com/yungyuchen521/einvoice-visualizer/main/tw_topo.json";

const DATA_URL =
    "https://raw.githubusercontent.com/yungyuchen521/einvoice-visualizer/main/data.csv";

const CENTER_LONG = 123;
const CENTER_LAT = 24;
const MAP_SCALE = 10000;

const COLOR_SELECTED = "black";

const CACHE = {};
const BUSINESS_KEY = "business";
const CONSUMPTION_KEY = "consumption";

d3.json(TW_MAP_URL)
    .then((data) => {
        const projectmethod = d3.geoMercator().center([CENTER_LONG, CENTER_LAT]).scale(MAP_SCALE);
        const pathGenerator = d3.geoPath().projection(projectmethod);
        const geometries = topojson.feature(data, data.objects["COUNTY_MOI_1090820"]);

        const g = SVG.append("g").attr("transform", "translate(400,100)");
        g.selectAll("path")
            .data(geometries.features)
            .enter()
            .append("path")
            .attr("d", pathGenerator)
            .attr("class", "county")
            .attr("selected", false)
            .attr("county-id", (_, i) => COUNTY_ID_TABLE[i])
            .on("click", handleRegionClick);
    })
    .then(() => {
        d3.csv(DATA_URL).then((data) => {
            const business_dict = {}; // Record<string, County>
            const consumption_dict = {}; // Record<string, County>

            data.forEach((d) => {
                const b_id = d.business_cnty_id;
                const c_id = d.customer_cnty_id;
                if (!b_id || !c_id) return;

                if (!(b_id in business_dict)) business_dict[b_id] = new County(b_id);
                if (!(c_id in consumption_dict)) consumption_dict[c_id] = new County(c_id);

                business_dict[b_id].addRecord(c_id, +d.year, +d.amount, +d.count);
                consumption_dict[c_id].addRecord(b_id, +d.year, +d.amount, +d.count);
            });

            CACHE[BUSINESS_KEY] = business_dict;
            CACHE[CONSUMPTION_KEY] = consumption_dict;
        });
    });

const refreshPlot = () => {
    const perspective = document.getElementById("perspective").value;
    const crit = document.getElementById("criterion").value;
    const start_year = +document.getElementById("start-year").value;
    const end_year = +document.getElementById("end-year").value;

    const selected_cnty_ids = Array.from(
        document.querySelectorAll("path.county[selected='true']")
    ).map((ele) => ele.getAttribute("county-id"));

    let records = null;
    selected_cnty_ids.forEach((id) => {
        const tmp = CACHE[perspective][id].getRecords(start_year, end_year, crit);
        if (!records) records = tmp;
        else {
            Object.keys(tmp).forEach((k) => {
                records[k] += tmp[k];
            });
        }
    });

    let max_val = 0;
    Object.keys(records).forEach((id) => {
        if (selected_cnty_ids.includes(id)) return;
        max_val = Math.max(max_val, records[id]);
    });

    const colorScale = d3
        .scaleSequential()
        .domain([-max_val * 0.2, max_val])
        .interpolator(d3.interpolateReds);

    d3.selectAll("path.county").each(function () {
        const target = d3.select(this);
        const id = target.attr("county-id");
        if (selected_cnty_ids.includes(id)) return;

        target.style("fill", colorScale(records[id]));
    });
};

const clearPlot = () => {
    d3.selectAll("path.county").each(function () {
        d3.select(this).attr("selected", "false").style("fill", null);
    });
};

function handleRegionClick() {
    target = d3.select(this);
    if (target.attr("selected") == "false") {
        target.style("fill", COLOR_SELECTED);
        target.attr("selected", "true");
    } else {
        target.style("fill", null);
        target.attr("selected", "false");
    }
}

const addToolTip = (target, data_dict) => {
    const tooltip = d3.select("#tooltip");
    const cls = target.getAttribute("id");

    target.addEventListener("mousemove", (e) => {
        tooltip.style("left", e.screenX - 150 + "px").style("top", e.screenY - 250 + "px");
        tooltip.select("#qtr").html(`${dt.getFullYear()} / ${dt.getMonth() + 1}`);
        tooltip.select("#sales").html(data_dict[dt][cls]);
    });

    target.addEventListener("mouseover", () => tooltip.style("opacity", "1"));

    target.addEventListener("mouseout", () => tooltip.style("opacity", "0"));
};

function removeToolTip() {
    this.removeEventListener()
}

// SVG.call(
//     d3.zoom().on("zoom", () => {
//         g.attr("transform", d3.event.transform);
//     })
// );
