class CarrierRecord {
    static KEY_AMNT = "amount";
    static KEY_CNT = "count";
    static KEY_AVG = "average";

    constructor(year, ind_id, amount, count) {
        this.year = year;
        this.ind_id = ind_id;
        this.amount = amount;
        this.count = count;
    }
}

class County {
    constructor(id) {
        this.id = id;
        this.record_dict = {}; // { county_id: [ records, ... ] }
    }

    addRecord(county_id, year, ind_id, amount, count) {
        if (!(county_id in this.record_dict)) this.record_dict[county_id] = [];
        this.record_dict[county_id].push(new CarrierRecord(year, ind_id, amount, count));
    }

    getRecords(start_year, end_year, selected_industry_ids, key) {
        const results = {};
        Object.keys(this.record_dict).forEach((id) => {
            let [amount, count] = [0, 0];

            this.record_dict[id].forEach((record) => {
                if (record.year < start_year || record.year > end_year) return;
                if (!selected_industry_ids.includes(record.ind_id)) return;
                amount += record.amount;
                count += record.count;
            });

            switch (key) {
                case CarrierRecord.KEY_AMNT:
                    results[id] = amount;
                    break;
                case CarrierRecord.KEY_CNT:
                    results[id] = count;
                    break;
                case CarrierRecord.KEY_AVG:
                    results[id] = amount / count;
                    break;
            }
        });

        return results;
    }
}
