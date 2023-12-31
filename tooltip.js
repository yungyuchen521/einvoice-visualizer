const addToolTip = (target, cnty_name, value) => {
    target.addEventListener("mouseover", showToolTip);
    target.addEventListener("mouseout", hideToolTip);
};

const showToolTip = (event) => {
    const tooltip = d3.select("div.tooltip-container");

    tooltip.style("opacity", "1");
    tooltip.style("left", event.screenX - 150 + "px").style("top", event.screenY - 150 + "px");

    tooltip.select("#county").html(cnty_name);
    tooltip.select("#value").html(Math.round(value));
};

const hideToolTip = () => {
    const tooltip = d3.select("div.tooltip-container");
    tooltip.style("opacity", "0");
};

function removeToolTip() {
    this.removeEventListener("mouseout", hideToolTip);
}
