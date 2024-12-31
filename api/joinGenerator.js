function shuffle(array) {
    array = array.slice();
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;    
}

function randomJoin() {
    const options = [
        "LEFT JOIN",
        "RIGHT JOIN",
        "INNER JOIN",
        "OUTER JOIN"
    ];
    return options[Math.random()*options.length|0]
}

function randomOp() {
    const options = [
        "<",
        ">",
    ];
    return options[Math.random()*options.length|0]
}


function makeJoinQuery(depth=3) {
    const tables = ['a', 'b', 'c', 'd'].slice(0, depth);

    // Select order is stable
    let sql = `SELECT ${tables.map(name => `${name}.data`).join(', ')}\n`;
    sql += `FROM \n`;

    const fromTables = shuffle(tables);

    sql += `\t${fromTables[0]}\n`;
    for ( let i = 1; i < fromTables.length; ++i) {
        const prev = fromTables[i - 1], cur = fromTables[i];
        sql += '\t'
        sql += randomJoin();
        const op = randomOp();
        sql += ` ${cur} on ${prev}.data ${op} ${cur}.data\n`
    }

    if (depth >= 3 ) {
        // 3-way predicate
        const restrict = shuffle(tables).slice(0, 3);
        sql += "WHERE \n\t"
        sql += `${restrict[0]}.data + ${restrict[1]}.data < ${restrict[2]}.data`
        sql += '\n';
    }

    sql += `ORDER BY ${tables.map((_, idx) => `${idx + 1} asc`).join(', ')}\n`

    return sql;

}

// Tables are created identically as so:
// CREATE TABLE a AS
// SELECT generate_series(1, 100) AS id, floor(random() * 1000000) AS data;


console.log(makeJoinQuery())







