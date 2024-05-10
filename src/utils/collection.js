const pluck = (key, array) =>
    array.reduce((values, current) => {
        values.push(current[key]);

        return values;
    }, []);

module.exports = {
    pluck
}
