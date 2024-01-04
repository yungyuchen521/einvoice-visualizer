const CENTER_LONG = 123;
const CENTER_LAT = 24;
const MAP_SCALE = 8000;

const CACHE = {};

d3.json(TW_MAP_URL)
    .then((data) => {
        CACHE[CACHE_KEY_TOPO] = data;
        d3.selectAll("svg").each(drawMap);
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

function drawMap() {
    const data = CACHE[CACHE_KEY_TOPO];
    const projectmethod = d3.geoMercator().center([CENTER_LONG, CENTER_LAT]).scale(MAP_SCALE);
    const pathGenerator = d3.geoPath().projection(projectmethod);
    const geometries = topojson.feature(data, data.objects["COUNTY_MOI_1090820"]);

    const svg = d3.select(this);
    svg.html("");
    const x_offset = document.querySelectorAll("svg").length <= 2 ? 200 : 100;

    const g = svg.append("g").attr("transform", `translate(${x_offset}, 50)`);
    g.selectAll("path")
        .data(geometries.features)
        .enter()
        .append("path")
        .attr("d", pathGenerator)
        .attr("class", "county")
        .attr("selected", false)
        .attr("county-id", (_, i) => TOPO_COUNTY_TABLE[i])
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
        max_val_list.push(max_value);
    });

    svg_list.forEach((svg, i) => {
        svg = d3.select(svg);
        svg.select("g.legend").remove();
        const selected_cnty_ids = getSelectedCountyIds(svg);

        const max_val = COMPARE_BY == COMPARE_BY_CRIT ? max_val_list[i] : d3.max(max_val_list);
        const colorScale = d3
            .scaleSequential()
            .domain([-max_val * 0.2, max_val])
            .interpolator(d3.interpolateReds);

        svg.selectAll("path.county").each(function () {
            const target = d3.select(this);
            const id = target.attr("county-id");

            if (selected_cnty_ids.includes(id)) removeToolTip(this);
            else {
                target.style("fill", colorScale(data_list[i][id]));
                addToolTip(this, COUNTY_DICT[id], data_list[i][id]);
            }
        });

        if (i == 0 || COMPARE_BY == COMPARE_BY_CRIT) addLegend(svg, 0, max_val, colorScale);
    });
};

const getData = (svg) => {
    svg = d3.select(svg);
    svg.select("g.legend").remove();

    const val = svg.attr("val");
    const perspective = COMPARE_BY == COMPARE_BY_PERSPECTIVE ? val : getCheckedRadio("perspective");
    const start_year =
        COMPARE_BY == COMPARE_BY_YEAR ? +val : +document.getElementById("start-year").value;
    const end_year =
        COMPARE_BY == COMPARE_BY_YEAR ? +val : +document.getElementById("end-year").value;
    const crit = COMPARE_BY == COMPARE_BY_CRIT ? val : getCheckedRadio(COMPARE_BY_CRIT);
    const selected_industry_ids = COMPARE_BY == COMPARE_BY_IND ? [val] : getSelectedIndustryIds();

    const selected_cnty_ids = getSelectedCountyIds(svg);

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

const getCheckedRadio = (name) => {
    return document.querySelector(`input[type='radio'][name='${name}']:checked`).value;
};

const getSelectedIndustryIds = () => {
    const checkbox_list = document.querySelectorAll("input[type='checkbox']");
    const results = [];
    checkbox_list.forEach((cb) => {
        if (cb.checked) results.push(cb.getAttribute("code"));
    });

    return results;
};

const getSelectedCountyIds = (svg) => {
    results = [];
    svg.selectAll("path.county[selected='true']").each(function () {
        results.push(d3.select(this).attr("county-id"));
    });
    return results;
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

function handleRegionClick() {
    const cnty_id = d3.select(this).attr("county-id");

    function toggle(target) {
        if (!target) target = d3.select(this);

        if (target.attr("selected") == "false") {
            target.style("fill", COLOR_SELECTED);
            target.attr("selected", "true");
        } else {
            target.style("fill", null);
            target.attr("selected", "false");
        }
    }

    if (COMPARE_BY == COMPARE_BY_COUNTY) {
        toggle(d3.select(this));
        const cnty_name = COUNTY_DICT[cnty_id];
        const h1 = this.closest("div").querySelector("h1");
        let titles = h1.innerText.split(", ");

        if (titles[0] == "") titles = [cnty_name];
        else if (titles.includes(cnty_name)) titles = titles.filter((t) => t != cnty_name);
        else titles.push(cnty_name);
        h1.innerText = titles.join(", ");
    } else {
        d3.selectAll(`path[county-id="${cnty_id}"]`).each(function () {
            toggle(d3.select(this));
        });
    }
}

const addToolTip = (target, cnty_name, value) => {
    const tooltip = d3.select("div.tooltip-container");

    target.addEventListener("mouseover", (e) => {
        tooltip.style("opacity", "1");
        tooltip.style("left", e.screenX + 100 + "px").style("top", e.screenY - 100 + "px");

        tooltip.select("#county").html(cnty_name);
        tooltip.select("#value").html(Math.round(value));
    });
    target.addEventListener("mouseout", () => tooltip.style("opacity", "0"));
};

const removeToolTip = (target) => {
    const copy = target.cloneNode(true);
    target.replaceWith(copy);
    copy.addEventListener("click", handleRegionClick);
};
