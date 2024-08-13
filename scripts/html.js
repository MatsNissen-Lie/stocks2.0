const mineAksje = [
  "NDX",
  "AAPL",
  "MSFT",
  "GOOGL", //4
  "TSLA",
  // 'SPX',
  // 'AMZN',
  // 'BTC/USD',
];
mineAksje.forEach((aksje) => {
  selStock.innerHTML += `<option value="${aksje}">${aksje}</option>`;
});
const comapre_selector = (valgt_aksje) => {
  const compare = document.getElementById("compare");
  compare.innerHTML = "";
  mineAksje.forEach((aksje) => {
    if (aksje !== valgt_aksje) {
      compare.innerHTML += `<option value="${aksje}">${aksje}</option>`;
    }
  });
};

let chart_data; // = {
//     values: sliced_values,
//     meta: {
//         index: pre_data,
//         intervall: intervall,
//         Symbol: symboler[i]
//     }
// }
const vis_aksje = async () => {
  datasets = {};
  const symbol = document.getElementById("selStock").value;
  const intervallInp = document.getElementById("intervall").value;
  const startDatoInp = document.getElementById("startDato").value;
  const sluttDatoInp = document.getElementById("sluttDato").value;
  const data = await hent_data(
    [symbol],
    startDatoInp,
    sluttDatoInp,
    intervallInp,
    250
  );

  chart_data = data[symbol];
  const arr = data[symbol].values;
  createDataset(symbol, arr, data[symbol].meta.index);
  makeChart();
  comapre_selector(symbol);
};

const vis_EMA = (new_chart = true) => {
  const num = Number(document.getElementById("ema_num").value);
  const lable = num + " EMA";
  if (lable in datasets) delete datasets[lable];
  else {
    const start_index = chart_data.meta.index;
    const EMA = ema(chart_data.values, start_index, num, 2);
    createDataset(num, EMA, 0, "EMA");
  }
  if (new_chart) makeChart();
};
const vis_bands = (new_chart = true) => {
  const num = Number(document.getElementById("bands_num").value);
  if ("BB " + num in datasets) {
    delete datasets["BB " + num];
    delete datasets["BB low"];
    delete datasets["BB high"];
  } else {
    const start_index = chart_data.meta.index;
    const bollingerArr = bollingerBands(chart_data.values, start_index, num, 2);
    BB_datasets(bollingerArr, num);
  }
  if (new_chart) makeChart();
};

const vis_treding_stock_portfolio = async (symboler, n, SD_vekting) => {
  const start_index = chart_data.meta.index;
  const start_date = chart_data.values[start_index].datetime;
  const end_date = chart_data.values.slice(-1)[0].datetime;
  const intervall = chart_data.meta.intervall;
  if (intervall !== "1day")
    return alert("Minutt data er ikke parallell. Sett invtervall like day");
  const data = await hent_data(symboler, start_date, end_date, intervall, 250);

  const komb = kombinatorikk_TSP(data, start_index);
  let dataset = treding_stock_portfolio(
    data,
    start_index,
    komb[1].n,
    komb[1].SD_vekting
  );
  // let dataset = treding_stock_portfolio(data, start_index, n, SD_vekting) //30x//2012//agm

  createDataset(
    " av trending aksjer",
    dataset.portfolio,
    0,
    "Portfolio",
    dataset.symboler
  );
  vis_resultater_relativ(dataset.portfolio, chart_data.values, start_index);
  makeChart();
};
const vis_smart_stock_picker = async (
  symboler,
  marketindex,
  startegisett,
  indicator_meta
) => {
  const start_index = chart_data.meta.index;
  const start_date = chart_data.values[start_index].datetime;
  const end_date = chart_data.values.slice(-1)[0].datetime;
  const intervall = chart_data.meta.intervall;
  symboler.push(marketindex);
  if (intervall !== "1day")
    return alert("Minutt data er ikke parallell. Sett invtervall like day");
  if (indicator_meta > 250)
    console.log("Du trenger mer pre_dta for vis_smart_stock_picker()");
  const data = await hent_data(symboler, start_date, end_date, intervall, 250);
  const index_values = data[marketindex].values;
  delete data[marketindex];
  // kombinatorikk_SSP
  // const best_n = kombinatorikk_SSP(data, index_values, start_index, startegisett)
  // let dataset = smart_stock_picker(data, index_values, start_index, startegisett, best_n)

  let dataset = smart_stock_picker(
    data,
    index_values,
    start_index,
    startegisett,
    indicator_meta
  );
  createDataset(dataset.symboler, dataset.portfolio, 0, "Portfolio");
  vis_resultater_relativ(dataset.portfolio, chart_data.values, start_index);
  makeChart();
};

const vis_smart_algo = async () => {
  const lable = chart_data.meta.symbol + " 1min Algoritme";
  if (lable in datasets) {
    delete datasets[lable];
    makeChart();
    return;
  }
  const start_index = chart_data.meta.index;
  const start_date = chart_data.values[start_index].datetime;
  const end_date = chart_data.values.slice(-1)[0].datetime;
  const data = chart_data.values;

  // const best_strat = kombinatorikk_algo(data, start_index, NDX_strategisett.meta)
  let min_values = null; //min data finnes bare etter 2020-03-25
  if (start_date >= "2020-03-25") {
    const min_data = await hent_data(
      [chart_data.meta.symbol],
      start_date,
      end_date,
      "1min",
      0
    );
    min_values = min_data[chart_data.meta.symbol].values;
  }

  // const resultat = smart_algo(data, start_index, min_values, [best_strat], NDX_strategisett.meta);
  const bollingerArr = bollingerBands(data, start_index, 20, 2);
  const resultat = algo(
    data,
    start_index,
    NDX_strategisett2.strats,
    NDX_strategisett.meta,
    min_values,
    bollingerArr,
    false
  );
  const portfolio = resultat.portfolio;
  // const data_arr = portfolio.map(obj => {return obj.close})
  createDataset(chart_data.meta.symbol + " 1min", portfolio, 0, "Algoritme");
  vis_resultater(portfolio, data, start_index);
  makeChart();
};

const vis_algo = async (tomorrow = false) => {
  const start_index = chart_data.meta.index;
  const symbol = chart_data.meta.symbol;
  const start_date = chart_data.values[start_index].datetime;
  const end_date = chart_data.values.slice(-1)[0].datetime;
  const data = chart_data.values;

  // const strategi = kombinatorikk_algo(data, start_index, NDX_strategisett.meta)
  // const resultat = algo(data, start_index, [strategi], NDX_strategisett.meta);
  // const strategiMeta = kombinatorikk_strategiMeta(data, start_index, NDX_strategisett.strats)
  // const resultat = algo(data, start_index, NDX_strategisett.strats, strategiMeta);
  const bollingerArr = []; //bollingerBands(data, start_index, 20, 2);
  const resultat = algo(
    data,
    start_index,
    NDX_strategisett.strats,
    NDX_strategisett.meta,
    null,
    bollingerArr,
    tomorrow
  ); //med bollinger strats
  // const resultat = algo(data, start_index, NDX_strategisett.strats, NDX_strategisett.meta, null, [], tomorrow) // uten bollinger bands
  console.log(resultat.trads);

  // console.log('trads',resultat.trads)
  // const min_data_index = await hent_data([chart_data.meta.symbol], start_date, end_date, '1min', start_index)
  // const min_trads = find_min_values_for_trads(resultat.trads, min_data_index[chart_data.meta.symbol].values)
  // console.log(min_trads)

  const portfolio = resultat.portfolio;
  console.log(portfolio);
  // const data_arr = portfolio.map(obj => {return obj.close})
  createDataset(chart_data.meta.symbol, portfolio, 0, "Algoritme");
  vis_resultater(portfolio, data, start_index);
  makeChart();
};
const vis_index_trad = async (dayTrad = false, tilnærming = false) => {
  const lable0 = chart_data.meta.symbol + " 1min Algoritme";
  if ("Index Trad" in datasets || "Index Daytrad" in datasets) {
    delete datasets["Index Trad"];
    delete datasets["Index Daytrad"];
    makeChart();
    return;
  }
  const start_index = chart_data.meta.index;
  const start_date = chart_data.values[start_index].datetime;
  const end_date = chart_data.values.slice(-1)[0].datetime;
  const data = chart_data.values;
  // if (chart_data.meta.symbol === "NDX" && !dayTrad) return vis_algo(true);
  if (start_date < "2020-03-25")
    return alert(
      "Kan ikke beregne index trad. Det finnes ikke minutt data før 2020-03-25."
    );
  const day_data_index = await hent_data(
    ["NDX"],
    start_date,
    end_date,
    "1day",
    start_index
  );
  const min_data_index = await hent_data(
    ["NDX"],
    start_date,
    end_date,
    "1min",
    start_index
  );
  const day_values_index = day_data_index["NDX"].values;
  const min_values_index = min_data_index["NDX"].values;

  let resultat;
  // console.log(day_data_index, min_data_index);

  // const bollingerArr = bollingerBands(day_values_index, start_index, 20, 2);
  if (dayTrad)
    resultat = algo(
      day_values_index,
      start_index,
      NDX_strategisett2.strats,
      NDX_strategisett2.meta,
      min_values_index
      // bollingerArr
    );
  else
    resultat = algo(
      day_values_index,
      start_index,
      NDX_strategisett.strats,
      NDX_strategisett.meta,
      null,
      [], //  bollingerArr
      true
    );
  // const resultat = algo(day_values_index, start_index, NDX_strategisett.strats, NDX_strategisett.meta);

  const min_data = await hent_data(
    [chart_data.meta.symbol],
    start_date,
    end_date,
    "1min",
    0
  );
  const min_values = min_data[chart_data.meta.symbol].values;

  let min_trads_stock;
  let lable;
  if (dayTrad) {
    min_trads_stock = samtidig_kurser(min_values, resultat.trads, tilnærming);
    lable = "Index Daytrad";
  } else {
    // console.log('Index trads',resultat.trads)
    const min_index_trads = find_min_values_for_trads(
      resultat.trads,
      min_values_index
    );
    min_trads_stock = samtidig_kurser(min_values, min_index_trads, tilnærming);
    lable = "Index Trad";
    console.log("Stock trads", min_trads_stock);
  }

  const portfolio = calculate_portfolio(data, min_trads_stock);
  // const data_arr = portfolio.map(obj => {return obj.close})
  createDataset(chart_data.meta.symbol, portfolio, start_index, lable);
  vis_resultater(portfolio, data, start_index);
  makeChart();
};
const vis_index_trad_multi = async (
  symboler,
  marketindex,
  pickerStrategier,
  indicator_meta
) => {
  const grafNavn = "Protfolje som trader trading aksjer";
  if (grafNavn in datasets) {
    delete datasets[grafNavn];
    makeChart();
    return;
  }
  // console.log(222)
  const start_index = chart_data.meta.index;
  const start_date = chart_data.values[start_index].datetime;
  const end_date = chart_data.values.slice(-1)[0].datetime;
  const intervall = chart_data.meta.intervall;
  // symboler.push(marketindex)
  if (intervall !== "1day")
    return alert("Minutt data er ikke parallell. Sett invtervall like day");
  if (start_date < "2020-03-25")
    return alert(
      "Kan ikke beregne index trad. Det finnes ikke minutt data før 2020-03-25."
    );
  if (indicator_meta > start_index)
    console.log("Du trenger mer pre_dta for vis_smart_stock_picker()");

  const index_data = await hent_data(
    [marketindex],
    start_date,
    end_date,
    intervall,
    start_index
  );
  const index_values = index_data[marketindex].values;
  const bollingerArr = bollingerBands(index_values, start_index, 20, 2);
  const resultat = algo(
    index_values,
    start_index,
    NDX_strategisett.strats,
    NDX_strategisett.meta,
    null,
    bollingerArr
  );
  const min_data_index = await hent_data(
    [marketindex],
    start_date,
    end_date,
    "1min",
    0
  );
  const min_values_index = min_data_index[marketindex].values;
  const min_index_trads = find_min_values_for_trads(
    resultat.trads,
    min_values_index
  );
  console.log("Index Trads", min_index_trads);
  const min_data = await hent_data(symboler, start_date, end_date, "1min", 0);
  const data_obj = await hent_data(
    symboler,
    start_date,
    end_date,
    intervall,
    start_index
  );
  const multiTrads = samtidig_kurser_flere_aksjer(
    data_obj,
    min_data,
    min_index_trads,
    index_values,
    start_index,
    pickerStrategier,
    indicator_meta
  );
  console.log("Trads av flere aksjer", multiTrads);
  const dataset = calculate_multi_portfolio(
    data_obj,
    start_index,
    multiTrads,
    index_values,
    pickerStrategier,
    indicator_meta
  );
  // const data_arr = dataset.portfolio.map(obj => {return obj.close})
  createDataset(grafNavn, dataset.portfolio, 0, "Portfolio", dataset.symboler);
  vis_resultater_relativ(dataset.portfolio, chart_data.values, start_index);
  makeChart();
};

const vis_mine_transaksjoner = async () => {
  const start_index = chart_data.meta.index;
  const start_date = chart_data.values[start_index].datetime;
  const end_date = chart_data.values.slice(-1)[0].datetime;
  const data = chart_data.values;
  const symbol = chart_data.meta.symbol;
  const dataFound = symbol in transaksjonerChart;
  if (!dataFound) return alert("Finner ingen transaksjoner for valgt aksje");
  const stockTrads = transaksjonerChart[symbol];
  let trads = slice_datoer(stockTrads, start_date, end_date);
  if (trads[0].invest) trads.splice(0, 1); //Jeg fjerner første om det er buy.
  if (trads.length === 0)
    return alert("Finner ingen transaksjoner for valgt periode");
  console.log("min transaksjoner", trads);
  const portfolio = calculate_portfolio(data, trads);
  // const data_arr = portfolio.map(obj => {return obj.close})
  createDataset(
    chart_data.meta.symbol,
    portfolio,
    start_index,
    "Transaksjoner"
  );
  vis_resultater(portfolio, data, start_index);
  makeChart();
};

const comapre_stock = async () => {
  const symbol = document.getElementById("compare").value;
  const lable = symbol + " compare";
  if (lable in datasets) delete datasets[lable], relativ_datasets(datasets);
  else {
    const data = await hent_data(
      [symbol],
      chart_data.values[chart_data.meta.index].datetime,
      chart_data.values[chart_data.values.length - 1].datetime,
      chart_data.meta.intervall,
      0
    );
    if (
      data[symbol].values.length !==
      chart_data.values.length - chart_data.meta.index
    )
      return console.log(
        data[symbol].values.length,
        chart_data.values.length - chart_data.meta.index,
        "data ikke parallell"
      );
    // const data_arr = data[symbol].values.map(obj => {return obj.close})
    createDataset(symbol, data[symbol].values, 0, "compare");
  }
  makeChart();
};
function updateSecRes(indikatorer, relativAvkastning, indikatorer2) {
  const secRes = document.querySelector("#secRes");
  secRes.innerHTML = `
      <p>Return ${round(indikatorer.avkastning, 2)}%</p>
      <p>Performance ${round(relativAvkastning, 2)}%</p>
      <p> Total return ${round(
        ((indikatorer.avkastning / 100 + 1) * (relativAvkastning / 100 + 1) -
          1) *
          100,
        2
      )}%</p>
      `;
  // <p>Mean return ${round(indikatorer2.stigning, 4)}%</p>
  // <p>Mean volitilitet ${round(indikatorer2.volitilitet, 4)}%</p>
  // <p>Standardavvik ${round(indikatorer.SD_percent,2)}%</p>
}

const vis_resultater = (portfolio, data_values, start_index_data_values) => {
  const slutt_index_values = data_values.length - 1;
  const indikatorer = indicators(
    data_values,
    start_index_data_values,
    slutt_index_values
  );
  const indikatorer2 = mean_indicators(
    data_values,
    start_index_data_values,
    slutt_index_values
  );
  const relativAvkastning =
    (portfolio.slice(-1)[0].close / data_values.slice(-1)[0].close - 1) * 100;
  updateSecRes(indikatorer, relativAvkastning, indikatorer2);
};

const vis_resultater_relativ = (portfolio, data_values, start_index) => {
  const slutt_index_values = data_values.length - 1;
  const avkastning =
    data_values.slice(-1)[0].close / data_values[start_index].close - 1;
  const Perfomance = portfolio.slice(-1)[0].close / (avkastning + 1);
  const indikatorer2 = mean_indicators(
    data_values,
    start_index,
    slutt_index_values
  );
  updateSecRes(indikatorer, relativAvkastning, indikatorer2);
};

const tomorrow = async () => {
  const today = new Date().toISOString().split("T")[0];
  const data = await hent_data(
    smart_trending_comparison,
    today,
    today,
    "1day",
    250
  );
  const index_values = data["NDX"].values;
  delete data["NDX"];
  let start_index = data["AAPL"].values.length;
  if (markedIsOpen()) start_index - 1;
  const valgt_strat = choose_strat(
    index_values,
    picker_strats,
    start_index - 1 - picker_days,
    start_index - 1
  );
  // console.log(valgt_strat)
  const trendig_stock = stockPicker(
    data,
    start_index - 1,
    valgt_strat.n_days,
    valgt_strat.SD_vekting
  );
  console.log(
    "Most trending stock for tomorrow (today if marked is open): " +
      trendig_stock
  );
};

const initialize = async () => {
  await vis_aksje();
  await tomorrow();
  vis_resultater(chart_data.values, chart_data.values, chart_data.meta.index);
  // await vis_algo()
  await vis_index_trad();
  // await vis_index_trad_multi(trending_comparison, 'NDX', picker_strats, picker_days)

  // setTimeout(async ()=>{await vis_mine_transaksjoner()},1000)

  // await vis_smart_algo()
  // await vis_index_trad()
  // vis_smart_stock_picker(trending_comparison, 'NDX', picker_strats, picker_days)
  // vis_treding_stock_portfolio(trending_comparison, 25, 0.6) //generell
  // vis_treding_stock_portfolio(trending_comparison, 25, 1.4)// gunstig i et mer volitilit marked.
  // vis_treding_stock_portfolio(trending_comparison, 31, 1.4)// gunstig nå
  // vis_EMA()
};
initialize();
