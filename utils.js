module.exports = {
    iterEx: function iter(o, cb) {
        Object.entries(o).some(function ([k, v]) {
            if (v !== null && typeof v === 'object') {
                iter(v, cb);
            }
        });
        cb(o);
    }
}