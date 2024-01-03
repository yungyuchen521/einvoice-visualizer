const IND_ID_RETAIL = 47;
const IND_ID_HOTEL = 55;
const IND_ID_CATERING = 56;

const CACHE_KEY_TOPO = "topo";
const CACHE_KEY_BUSINESS = "business";
const CACHE_KEY_CONSUMPTION = "consumption";

const COMPARE_BY_COUNTY = "county";
const COMPARE_BY_CRIT = "criteria";
const COMPARE_BY_YEAR = "year";
const COMPARE_BY_IND = "industry";

const REPO_URL = "https://raw.githubusercontent.com/yungyuchen521/einvoice-visualizer/main";
const TW_MAP_URL = `${REPO_URL}/tw_topo.json`;
const DATA_URL = `${REPO_URL}/data.csv`;

const COLOR_SELECTED = "black";

const COUNTY_DICT = {
    C: "Keelung",
    A: "Taipei",
    F: "New Taipei",
    H: "Taoyuan",
    O: "Hisnchu City",
    J: "Hsinchu County",
    K: "Miaoli",
    B: "Taichung",
    M: "Nantou",
    N: "Changhua",
    P: "Yunlin",
    I: "Chiayi City",
    Q: "Chiayi County",
    D: "Tainan",
    E: "Kaohsiung",
    T: "Pingtung",
    V: "Taitung",
    U: "Hualien",
    G: "Yilan",
    W: "Kinmen",
    X: "Penghu",
    Z: "Mazu",
};

const TOPO_COUNTY_TABLE = [
    "",
    "G",
    "N",
    "M",
    "P",
    "C",
    "A",
    "F",
    "B",
    "D",
    "H",
    "K",
    "I",
    "Q",
    "W",
    "E",
    "V",
    "U",
    "X",
    "O",
    "J",
    "T",
];
