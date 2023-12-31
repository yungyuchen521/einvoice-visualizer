const initNavItems = () => {
    const items = [COMPARE_BY_COUNTY, COMPARE_BY_CRIT, COMPARE_BY_YEAR, COMPARE_BY_IND];

    const parent = document.querySelector("#navbarSupportedContent ul");
    items.forEach((it) => {
        const a = document.createElement("a");
        a.setAttribute("class", "nav-link");
        a.innerText = `by ${it}`;
        a.addEventListener("click", updateCompareBy);
        a.setAttribute("val", it);

        const li = document.createElement("li");
        li.setAttribute("class", "nav-item");

        li.appendChild(a);
        parent.appendChild(li);
    });
};

function updateCompareBy() {
    COMPARE_BY = this.getAttribute("val");
    let values, titles;

    switch (COMPARE_BY) {
        case COMPARE_BY_COUNTY:
            values = ["", "", ""];
            titles = values;
            break;
        case COMPARE_BY_CRIT:
            values = ["amount", "count", "average"];
            titles = values;
            break;
        case COMPARE_BY_YEAR:
            values = ["2020", "2021", "2022", "2023"];
            titles = values;
            break;
        case COMPARE_BY_IND:
            values = ["47", "55", "56"];
            titles = ["retail", "hotel", "catering"];
            break;
    }

    d3.selectAll("a.nav-link").each(function () {
        const a = d3.select(this);
        a.attr("selected", a.attr("val") == COMPARE_BY ? "true" : "false");
    });

    initSvg(values, titles);
    d3.selectAll("svg").each(initPlot);
}

const initSvg = (values, titles) => {
    if (!titles) titles = values;

    const container = document.getElementById("svg-container");
    container.innerHTML = "";
    const col_width = 12 / titles.length;

    titles.forEach((t, i) => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", 440);
        svg.setAttribute("height", 650);
        svg.setAttribute("val", values[i]);

        const title = document.createElement("h1");
        title.setAttribute("class", "svg-title");
        title.innerText = t;

        const col = document.createElement("div");
        col.setAttribute("class", `col-sm-${col_width}`);

        col.appendChild(svg);
        col.appendChild(title);
        container.appendChild(col);
    });
};

initNavItems();
