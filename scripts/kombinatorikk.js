const kombinatorikk_TSP = (data, SI) => {
  let dataset = [];
  for (let n = 10; n < 40; n++) {
    for (let v = 0.1; v < 4; v += 0.1) {
      dataset.push([
        treding_stock_portfolio(data, SI, n, v),
        { n: n, SD_vektig: v },
      ]);
    }
  }
  dataset.sort(
    (a, b) => b[0].portfølje.slice(-1)[0] - a[0].portfølje.slice(-1)[0]
  );
  console.log(dataset[0][1]);
  return dataset[0];
};

const kombinatorikk_SSP = (data, index_values, start_index, strategisett) => {
  let dataset = [];
  for (let n = 10; n < 249; n++) {
    dataset.push([
      smart_stock_picker(
        data,
        index_values,
        start_index,
        strategisett,
        n
      ).portfølje.slice(-1)[0],
      n,
    ]);
  }
  dataset.sort((a, b) => b[0] - a[0]);
  // console.log( dataset)
  const best_n = dataset[0][1];
  console.log("Beste antall dager å velge for smart_stock_picker:" + best_n);
  return best_n;
};
const kombinatorikk_algo = (data_values, start_index, strategiMeta) => {
  let resulater = [];
  let range = {
    //hva som skal testes
    sell: {
      fra: 0.5,
      til: 7, //14
      intervall: 0.5,
    },
    selltid: {
      fra: 1, //1
      til: 10, //10
      intervall: 1,
    },
    cool: {
      fra: 1,
      til: 10, //9
    },
    buy: {
      fra: 0,
      til: 3,
      intervall: 1, //0.4
    },
    buytid: {
      fra: 1,
      til: 11,
      intervall: 1,
    },
  };
  let antall = (range.sell.til - range.sell.fra) / range.sell.intervall;
  antall =
    (antall * (range.selltid.til - range.selltid.fra + 1)) /
    range.selltid.intervall;
  antall = antall * (range.cool.til - range.cool.fra + 1);
  antall = (antall * (range.buy.til - range.buy.fra + 1)) / range.buy.intervall;
  antall =
    (antall * (range.buytid.til - range.buytid.fra + 1)) /
    range.buytid.intervall;
  console.log("antall kombinasjoner", round(antall, 0));
  if (antall > 150000) return console.log("gidder ikke det a");
  for (let s = range.sell.fra; s <= range.sell.til; s += range.sell.intervall) {
    for (
      let f = range.selltid.fra;
      f <= range.selltid.til;
      f += range.selltid.intervall
    ) {
      for (let c = range.cool.fra; c <= range.cool.til; c += 1) {
        for (
          let b = range.buy.fra;
          b <= range.buy.til;
          b += range.buy.intervall
        ) {
          for (
            let r = range.buytid.fra;
            r <= range.buytid.til;
            r += range.buytid.intervall
          ) {
            const strategier = [
              {
                stoploss: s / 100,
                falltid: f,
                cooldown: c,
                buy: b / 100,
                stigetid: r,
              },
            ];

            const res = algo(
              data_values,
              start_index,
              strategier,
              strategiMeta
            ).portfolio;
            resulater.push({
              res: res.slice(-1)[0],
              strategi: strategier[0],
            });
            // resulater.push([res_kurs, strategier])
          }
        }
      }
    }
  }
  resulater.sort((a, b) => b.res.close - a.res.close);
  const best_strat = resulater[0].strategi;
  console.log(resulater);
  console.log("Beste strategi: ", best_strat);
  return best_strat;
};

const kombinatorikk_strategiMeta = (data_values, start_index, strategier) => {
  let resulater = [];
  let range = {
    //hva som skal testes
    antalldager: {
      fra: 141, //1
      til: 141, //10
    },
    cool: {
      fra: 6,
      til: 6, //9
    },
    buy: {
      fra: 10,
      til: 60,
    },
  };
  let antall = range.antalldager.til - range.antalldager.fra + 1;
  antall = antall * (range.cool.til - range.cool.fra + 1);
  antall = antall * (range.buy.til - range.buy.fra + 1);
  console.log("antall kombinasjoner", round(antall, 0));
  for (let f = range.antalldager.fra; f <= range.antalldager.til; f++) {
    for (let c = range.cool.fra; c <= range.cool.til; c++) {
      for (let b = range.buy.fra; b <= range.buy.til; b++) {
        const strategiMeta = {
          indicator: f,
          cool: c,
          buy: b,
        };
        const res = algo(data_values, start_index, strategier, strategiMeta);
        resulater.push({
          res: res.portfolio.slice(-1)[0],
          stratMeta: res.stratMeta,
        });
        // resulater.push([res_kurs, strategier])
      }
    }
  }
  resulater.sort((a, b) => b.res.close - a.res.close);
  const best_strat = resulater[0].stratMeta;
  console.log(resulater);
  console.log("Beste strategi: ", best_strat);
  return best_strat;
};
