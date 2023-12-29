class CarrierRecord {
    static KEY_AMNT = "amount";
    static KEY_CNT = "count";
    static KEY_AVG = "average";

    constructor(year, amount, count) {
        this.year = year;
        this.amount = amount;
        this.count = count;
    }
}

class County {
    constructor(id) {
        this.id = id;
        this.record_dict = {}; // { county_id: { year: record } }
    }

    addRecord(county_id, year, amount, count) {
        if (!(county_id in this.record_dict)) this.record_dict[county_id] = {};
        this.record_dict[county_id][year] = new CarrierRecord(year, amount, count);
    }

    getRecords(start_year, end_year, key) {
        const getVal = (record, key) => {
            switch (key) {
                case CarrierRecord.KEY_AMNT:
                    return record.amount;
                case CarrierRecord.KEY_CNT:
                    return record.count;
                case CarrierRecord.KEY_AVG:
                    return record.amount / record.count;
                default:
                    return;
            }
        };

        const results = {};
        Object.keys(this.record_dict).forEach((id) => {
            results[id] = 0;
            for (let y = start_year; y <= end_year; y++) {
                const record = this.record_dict[id][y];
                results[id] += getVal(record, key);
            }
        });

        return results;
    }
}
