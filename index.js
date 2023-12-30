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

const CENTER_LONG = 123;
const CENTER_LAT = 24;
const MAP_SCALE = 8000;

const CACHE = {};

let COMPARE_BY = COMPARE_BY_IND;

d3.json(TW_MAP_URL)
    .then((data) => {
        CACHE[CACHE_KEY_TOPO] = data;
        d3.selectAll("svg").each(initPlot);
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

                business_dict[b_id].addRecord(c_id, +d.year, d.industry_id, +d.amount, +d.count);
                consumption_dict[c_id].addRecord(b_id, +d.year, d.industry_id, +d.amount, +d.count);
            });

            CACHE[CACHE_KEY_BUSINESS] = business_dict;
            CACHE[CACHE_KEY_CONSUMPTION] = consumption_dict;
        });
    });

function initPlot() {
    const data = CACHE[CACHE_KEY_TOPO];
    const projectmethod = d3.geoMercator().center([CENTER_LONG, CENTER_LAT]).scale(MAP_SCALE);
    const pathGenerator = d3.geoPath().projection(projectmethod);
    const geometries = topojson.feature(data, data.objects["COUNTY_MOI_1090820"]);

    const svg = d3.select(this);
    svg.html("");
    const g = svg.append("g").attr("transform", "translate(100, 50)");
    g.selectAll("path")
        .data(geometries.features)
        .enter()
        .append("path")
        .attr("d", pathGenerator)
        .attr("class", "county")
        .attr("selected", false)
        .attr("county-id", (_, i) => COUNTY_ID_TABLE[i])
        .on("click", handleRegionClick);

    g.select("path[county-id='W']").attr("transform", "translate(120)");
}

const refresh = () => {
    const data_list = [];
    const max_val_list = [];

    const svg_list = document.querySelectorAll("svg");

    svg_list.forEach((svg) => {
        const [data, max_value] = getData(svg);
        data_list.push(data);
        max_val_list.push(max_value)
    });

    const selected_cnty_ids = getSelectedCountyIds();
    svg_list.forEach((svg, i) => {
        svg = d3.select(svg);
        svg.select("g.legend").remove();

        const max_val = COMPARE_BY == COMPARE_BY_CRIT ? max_val_list[i] : d3.max(max_val_list)
        const colorScale = d3
            .scaleSequential()
            .domain([-max_val * 0.2, max_val])
            .interpolator(d3.interpolateReds);

        svg.selectAll("path.county").each(function () {
            const target = d3.select(this);
            const id = target.attr("county-id");
            if (selected_cnty_ids.includes(id)) return;

            target.style("fill", colorScale(data_list[i][id]));
        });

        if (i == 0 || COMPARE_BY == COMPARE_BY_CRIT) addLegend(svg, 0, max_val, colorScale);
    });
};

const getData = (svg) => {
    svg = d3.select(svg);
    svg.select("g.legend").remove();

    const key = svg.attr("key");
    const val = svg.attr("val");

    const start_year = key == COMPARE_BY_YEAR ? +val : +document.getElementById("start-year").value;
    const end_year = key == COMPARE_BY_YEAR ? +val : +document.getElementById("end-year").value;
    const crit = key == COMPARE_BY_CRIT ? val : document.getElementById("criterion").value;
    const selected_industry_ids = key == COMPARE_BY_IND ? [val] : getSelectedIndustryIds();

    const perspective = document.getElementById("perspective").value;
    const selected_cnty_ids = getSelectedCountyIds();

    let records = null;
    selected_cnty_ids.forEach((id) => {
        const tmp = CACHE[perspective][id].getRecords(
            start_year,
            end_year,
            selected_industry_ids,
            crit
        );

        if (!records) records = tmp;
        else Object.keys(tmp).forEach((k) => (records[k] += tmp[k]));
    });

    let max_val = 0;
    Object.keys(records).forEach((id) => {
        if (selected_cnty_ids.includes(id)) return;
        max_val = Math.max(max_val, records[id]);
    });

    return [records, max_val];
};

const addLegend = (svg, min_val, max_val, colorScale) => {
    const width = svg.attr("width");
    const margin = 50;
    const rect_h = 20;

    const scale = d3
        .scaleLinear()
        .range([margin, width - margin])
        .domain([min_val, max_val]);

    const axis = d3
        .axisBottom()
        .scale(scale)
        .tickSize(rect_h + 5)
        .tickValues([min_val, (min_val + max_val) / 2, max_val]);

    const g = svg.append("g").attr("class", "legend").attr("transform", `translate(0,${50})`);

    const step = (max_val - min_val) / 100;
    const linspace = d3.range(min_val, max_val, step);
    const w = width / linspace.length;
    linspace.forEach((d) => {
        g.append("rect")
            .style("fill", colorScale(d))
            .style("stroke-width", 0)
            .attr("width", w)
            .attr("height", rect_h)
            .attr("x", scale(d));
    });

    g.call(axis);
};

const clearPlot = () => {
    d3.selectAll("path.county").each(function () {
        d3.select(this).attr("selected", "false").style("fill", null);
    });
};

const getSelectedIndustryIds = () => {
    const checkbox_list = document.querySelectorAll("input[type='checkbox']");
    const results = [];
    checkbox_list.forEach((cb) => {
        if (cb.checked) results.push(cb.getAttribute("code"));
    });

    return results;
};

const getSelectedCountyIds = () => {
    const svg = document.querySelector("svg");
    return Array.from(svg.querySelectorAll("path.county[selected='true']")).map((ele) =>
        ele.getAttribute("county-id")
    );
};

function handleRegionClick() {
    const county_id = d3.select(this).attr("county-id");

    d3.selectAll(`path[county-id="${county_id}"]`).each(function () {
        target = d3.select(this);

        if (target.attr("selected") == "false") {
            target.style("fill", COLOR_SELECTED);
            target.attr("selected", "true");
        } else {
            target.style("fill", null);
            target.attr("selected", "false");
        }
    });
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
    this.removeEventListener();
}

// SVG.call(
//     d3.zoom().on("zoom", () => {
//         g.attr("transform", d3.event.transform);
//     })
// );