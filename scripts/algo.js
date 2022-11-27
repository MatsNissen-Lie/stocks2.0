//indcators
const stockPicker = (data_obj, i, n, SD_vekting) => {
  let treding = [];
  const keys = Object.keys(data_obj);
  keys.forEach((key) => {
    const values = data_obj[key].values;
    // console.log(values[i], key)
    const avkstning = values[i].close / values[i - n].close;
    const SD = standard_diviation(data_obj[key].values, i, n);
    const SD_percent = (SD.SD / SD.MA) * SD_vekting + 1;
    let relativ_avkastning = avkstning / Math.pow(SD_percent, 2);
    treding.push([relativ_avkastning, key, avkstning]);
  });
  treding.sort((a, b) => -a[0] + b[0]); // størst først
  return treding[0][1];
};
// stockPicker
const treding_stock_portfolio = (data_obj, start_index, n, SD_vekting) => {
  let symbol = stockPicker(data_obj, start_index, n, SD_vekting);
  let valgt_aksje = data_obj[symbol].values;
  let symbol_arr = [symbol];
  let portfolio = [1];
  for (let i = start_index + 1; i < valgt_aksje.length; i++) {
    symbol = stockPicker(data_obj, i - 1, n, SD_vekting);
    valgt_aksje = data_obj[symbol].values;
    // if(symbol !== symbol_arr.slice(-1)[0]) console.log(valgt_aksje[i].datetime + ' bytter til ' + symbol)
    const capital =
      (portfolio.slice(-1)[0] * valgt_aksje[i].close) /
      valgt_aksje[i - 1].close;
    portfolio.push(capital);
    symbol_arr.push(symbol);
  }
  return { portfolio: portfolio, symboler: symbol_arr };
};

const choose_strat = (data, strategier, start_index, end_index) => {
  const indicators = mean_indicators(data, start_index, end_index);
  strategier.forEach((strategi) => {
    strategi.regnAvvik(indicators.stigning, indicators.volitilitet);
  });
  strategier.sort((a, b) => a.avvik - b.avvik);
  const besteStrat = strategier[0];
  return besteStrat;
};

const smart_stock_picker = (
  data_obj,
  index_values,
  start_index,
  strategisett,
  indicator_n
) => {
  let valgt_strat = choose_strat(
    index_values,
    strategisett,
    start_index - 1 - indicator_n,
    start_index - 1
  );
  let symbol = stockPicker(
    data_obj,
    start_index - 1,
    valgt_strat.n_days,
    valgt_strat.SD_vekting
  );
  let valgt_aksje = data_obj[symbol].values;
  let symbol_arr = [symbol];
  let portfolio = [1];

  for (let i = start_index + 1; i < valgt_aksje.length; i++) {
    valgt_strat = choose_strat(
      index_values,
      strategisett,
      i - 1 - indicator_n,
      i - 1
    );
    symbol = stockPicker(
      data_obj,
      i - 1,
      valgt_strat.n_days,
      valgt_strat.SD_vekting
    );
    valgt_aksje = data_obj[symbol].values;
    // if(symbol !== symbol_arr.slice(-1)[0]) console.log(valgt_aksje[i].datetime + ' bytter til ' + symbol)
    const capital =
      (portfolio.slice(-1)[0] * valgt_aksje[i].close) /
      valgt_aksje[i - 1].close;
    portfolio.push(capital);
    symbol_arr.push(symbol);
  }
  return { portfolio: portfolio, symboler: symbol_arr };
};

//her comes tha moneey
const transaction_obj = (
  datetime,
  kurs,
  invest,
  index,
  strat,
  handelsRate = 0
) => {
  return {
    datetime: datetime,
    kurs,
    kurs,
    invest: invest,
    index: index,
    strat: strat,
    handelsRate: handelsRate,
  };
};
const index_transaction_obj = (datetime, kurs, invest) => {
  return { datetime: datetime, kurs, kurs, invest: invest };
};
const finn_sellinfo = (data_values, strat, i) => {
  let toppunkt = ekstremalpunkter(data_values, i - 1, strat.falltid).toppunkt;
  if (i !== data_values.length && toppunkt.close <= data_values[i].open) {
    toppunkt = {
      datetime: data_values[i].datetime,
      close: data_values[i].open,
      index: i,
    };
  }
  const onsketPris = toppunkt.close * (1 - strat.stoploss);
  return { onsketPris: onsketPris, toppunkt: toppunkt };
};
const finn_kjopinfo = (data_values, strat, stratMeta, i) => {
  const bunnpunkt = ekstremalpunkter(
    data_values,
    i - strat.stigetid,
    stratMeta.buy
  ).bunnpunkt;
  const onsketPris = bunnpunkt.close * (1 + strat.buy);
  return { onsketPris: onsketPris, bunnpunkt: bunnpunkt };
};

const finn_kurs_under_onsketpris = (data, onsketPris) => {
  let sellkurs;
  if (onsketPris > data.open) sellkurs = data.open;
  else if (data.low <= onsketPris && onsketPris <= data.high)
    sellkurs = onsketPris;
  return sellkurs;
};
const finn_kurs_over_onsketpris = (data, onsketPris) => {
  let kjopkurs;
  if (onsketPris < data.open) kjopkurs = data.open;
  else if (data.low <= onsketPris && onsketPris <= data.high)
    kjopkurs = onsketPris;
  return kjopkurs;
};

const day_trad = (
  day_data,
  min_values,
  invested,
  initsialKurs,
  onsketPris,
  index,
  strat
) => {
  let trads = [];
  for (let i = 0; i < min_values.length; i++) {
    const data = min_values[i];

    let handelskurs = onsketPris;
    if (i === 0 && initsialKurs !== onsketPris) handelskurs = data.open; //noen ganger er min open forksjellige fra day open...

    if (handelskurs <= day_data.low || handelskurs >= day_data.high) break;
    let kurs;
    if (!invested) kurs = finn_kurs_over_onsketpris(data, handelskurs);
    else kurs = finn_kurs_under_onsketpris(data, handelskurs);

    if (kurs) {
      let handelsRate = (kurs - data.low) / (data.high - data.low);
      if (i === 0 && initsialKurs !== onsketPris) handelsRate = "open";
      if (!handelsRate) handelsRate = 0;

      trads.push(
        transaction_obj(
          data.datetime,
          kurs,
          !invested,
          index,
          strat,
          handelsRate
        )
      );
      invested = !invested;
    }
  }
  return trads;
};
const change_day_trads = (data, data_yesterday, trads, invested) => {
  let change = 1;
  if (invested) change = (change * trads[0].kurs) / data_yesterday.close; // hvis jeg starter med å selge, justerer jeg kaptal etter gårsdagens sluttpris.
  if (trads.length > 1) {
    // hvis det er flere
    for (let i = 1; i < trads.length; i++) {
      const last_trad = trads[i - 1];
      const trad = trads[i];
      if (!trad.invest) change = (change * trad.kurs) / last_trad.kurs; //hvis jeg seller oppdaterer den ny verdi.
    }
  }
  const lastTrad = trads.slice(-1)[0];
  if (lastTrad.invest) change = (change * data.close) / lastTrad.kurs; // console.log('slutter med å kjøpe') //hvis siste er kjop
  return change;
};
const sufficient_min_data = (data_values) => {
  if (data_values.length < 300) return false;
  else if (
    data_values[0].datetime.split(" ")[1] !== "09:30:00" &&
    data_values[0].datetime.split(" ")[1] !== "09:31:00"
  )
    return false;
  else if (
    data_values.slice(-1)[0].datetime.split(" ")[1] !== "15:59:00" &&
    data_values.slice(-1)[0].datetime.split(" ")[1] !== "15:58:00"
  )
    return false;
  return true;
};

//shift
const algo = (
  data_values,
  start_index,
  strategier,
  stratMeta,
  min_values = null,
  bollingerBands = [],
  visTomorrow = false
) => {
  let strat = strategier[0];
  let invested = true;
  let portfolio = [
    {
      close: data_values[start_index].close,
      datetime: data_values[start_index].datetime,
      index: start_index,
    },
  ];
  let kapital;
  let cooldown = 0;
  let lastCool = 0; //Jeg husker på denne i tilfelle jeg trenger det til å beregne verider for morgendagen etter at løkken er ferdig.
  let trads = [];
  let lastTrad;
  for (let i = start_index + 1; i < data_values.length; i++) {
    const data = data_values[i];
    kapital = portfolio.slice(-1)[0].close;
    lastCool = cooldown; //til tomorrowAction

    if (strategier.length > 1)
      strat = choose_strat(
        data_values,
        strategier,
        i - 1 - stratMeta.indicator,
        i - 1
      );

    let handelsKurs;
    let onsketPris;
    let forenkling = 0;
    if (!invested) {
      //kjøp
      if (bollingerBands.length != 0) {
        const BBindex = i - start_index - 1; // velger verdi som samsvarer med gårsdagen.
        const BB_igår = bollingerBands[BBindex].bands[0];
        const BB_low_open = (BB_igår * (100 - 4)) / 100;
        const BB_low = (BB_igår * (100 - 6)) / 100;
        if (BB_low_open > data.open) onsketPris = BB_low_open;
        //, console.log('Marked åpner 4% under BB'+data.datetime)
        else if (BB_low > data.low) onsketPris = BB_low; //, console.log('Marked går 6% under BB'+data.datetime)
        if (onsketPris)
          handelsKurs = finn_kurs_under_onsketpris(data, onsketPris); // proaktiv handel => Jeg vil kjøpe dersom aksjen faller under gitt pris
      }
      // strategiene kan ikke blanes da de over er proaktive og de under er reaktiv.
      if (onsketPris == null) {
        //proaktiv strategi overkjører disse strategien.
        if (cooldown > 0) {
          cooldown -= 1;
          const toppunkt = ekstremalpunkter(
            data_values,
            lastTrad.toppunkt.index,
            stratMeta.cool
          ).toppunkt; // jeg vil ikke telle den dagen jeg solgte???-1
          onsketPris = toppunkt.close;
        } else {
          const kjopInfo = finn_kjopinfo(data_values, strat, stratMeta, i);
          onsketPris = kjopInfo.onsketPris;
        }
        handelsKurs = finn_kurs_over_onsketpris(data, onsketPris); // returner om kursen stiger over.
      }

      if (onsketPris !== handelsKurs)
        onsketPris = handelsKurs * (1 - strat.stoploss);
    } else if (invested) {
      // sell
      const sellInfo = finn_sellinfo(data_values, strat, i);
      onsketPris = sellInfo.onsketPris;
      handelsKurs = finn_kurs_under_onsketpris(data, onsketPris);
    }

    if (handelsKurs) {
      // hvis jeg finner den prisen jeg ønsker, handler jeg brah.
      let dayTrads = [];
      if (min_values === null) {
        dayTrads.push(
          transaction_obj(data.datetime, handelsKurs, !invested, i, strat, 0)
        ); //handler
        // if(data.low < onsketPris && !invested && handelsKurs !== onsketPris) dayTrads.push(transaction_obj(data.datetime, onsketPris, invested, i, strat, 0))// console.log(data.datetime, onsketPris, handelsKurs)
      } else {
        let min_values_today;
        if (min_values)
          min_values_today = slice_datoer(
            min_values,
            data.datetime,
            data.datetime,
            0
          );
        if (min_values) {
          //&& sufficient_min_data(min_values_today)
          dayTrads.push(
            ...day_trad(
              data,
              min_values_today,
              invested,
              handelsKurs,
              onsketPris,
              i,
              strat
            )
          ); //daytrader
        }
        if (dayTrads.length === 0) {
          if (min_values_today) {
            forenkling += 1;
          }

          dayTrads.push(
            transaction_obj(data.datetime, handelsKurs, !invested, i, strat)
          ); //handler
          if (dayTrads.slice(-1)[0].invest && data.close <= onsketPris)
            dayTrads.push(
              transaction_obj(data.datetime, onsketPris, invested, i, strat)
            );
          // selger
          else if (data.close >= onsketPris && !dayTrads.slice(-1)[0].invest)
            dayTrads.push(
              transaction_obj(data.datetime, onsketPris, invested, i, strat)
            ); // kjøper
        }
      }

      kapital =
        kapital *
        change_day_trads(
          data,
          data_values[i - 1],
          dayTrads,
          !dayTrads[0].invest
        );
      invested = dayTrads.slice(-1)[0].invest;

      trads.push(...dayTrads);
      if (invested == false) {
        lastTrad = finn_sellinfo(data_values, strat, i); // tar vare på sell info til cooldown
        cooldown = strat.cooldown;
      }
    } else if (invested)
      kapital = (kapital * data.close) / data_values[i - 1].close;

    portfolio.push({
      close: kapital,
      datetime: data.datetime,
      index: i,
    });
  }
  if (visTomorrow)
    tomorrow_action(
      data_values,
      strat,
      stratMeta,
      invested,
      lastTrad,
      cooldown,
      lastCool
    );
  // if(i === data_values.length-1)
  const resultat = {
    portfolio: portfolio,
    strategier: strategier,
    stratMeta: stratMeta,
    trads: trads,
  };
  // const tradDict = grouo_dayTrads(trads)
  // console.log(tradDict)
  // console.log('portfolio',portfolio)
  // console.log('trads: ', trads)
  return resultat;
};
const tomorrow_action = (
  data_values,
  strat,
  stratMeta,
  invested,
  lastTrad,
  cooldown,
  lastCool
) => {
  let marketOpen = markedIsOpen();
  let i = data_values.length;
  if (marketOpen) i = data_values.length - 1;
  if (invested) {
    const sellInfo = finn_sellinfo(data_values, strat, i);
    // console.log(sellInfo,i, data_values.length);
    const onsketPris = sellInfo.onsketPris;
    const toppunkt = sellInfo.toppunkt;
    console.log(
      strat.symbol,
      ": Hvis prisen faller med " + round(strat.stoploss * 100, 1) + "% fra",
      round(toppunkt.close, 0),
      "(" + data_values[toppunkt.index].datetime + ") til ",
      round(onsketPris, 2),
      "eller lavere, Sell!"
    );
    if (!marketOpen)
      console.log(
        "Husk at hvis markedet åpner over det tidligere topppunktet, blir det det nye referansepunktet."
      );
  } else {
    console.log("Husk BB strats då");
    if (cooldown > 0 || (marketOpen && lastCool > 0)) {
      const toppunkt = ekstremalpunkter(
        data_values,
        lastTrad.toppunkt.index,
        stratMeta.cool
      ).toppunkt; // jeg vil ikke telle den dagen jeg solgte???-1
      onsketPris = toppunkt.close;
      console.log(
        "Ingen handel! Vente",
        cooldown,
        "dag(er), men hvis markedet overstiger",
        round(onsketPris, 2),
        "før den tid, InVeST!."
      );
    } else {
      const kjopInfo = finn_kjopinfo(data_values, strat, stratMeta, i);
      const onsketPris = kjopInfo.onsketPris;
      const bunnpunkt = kjopInfo.bunnpunkt;
      console.log(
        strat.symbol,
        ": Hvis prisen stiger med " + strat.buy * 100 + "% fra",
        round(bunnpunkt.close, 0),
        "(" + data_values[bunnpunkt.index].datetime + ") til ",
        round(onsketPris, 2),
        "eller høyere, invester!"
      );
    }
  }
};

const find_min_values_for_trads = (trads, min_values) => {
  const dayToMinDict = {
    "2021-03-23": "2021-03-23 15:59:00",
    "2021-07-30": "2021-07-30 09:33:00",
    // '2020-10-16': '2020-10-16 15:59:00'
    "2022-03-28": "2022-03-28 09:30:00",
  };
  let min_trads = [];
  trads.forEach((trad) => {
    const dato = trad.datetime;
    const values = slice_datoer(min_values, dato, dato, 0);
    let newTrad;
    // console.log(min_values)
    for (let i = 0; i < values.length; i++) {
      const data = values[i];
      let handelsKurs;
      if (trad.invest) handelsKurs = finn_kurs_over_onsketpris(data, trad.kurs);
      else handelsKurs = finn_kurs_under_onsketpris(data, trad.kurs);
      if (handelsKurs) {
        newTrad = index_transaction_obj(
          data.datetime,
          handelsKurs,
          trad.invest
        );
        break;
      }
    }

    if (newTrad) min_trads.push(newTrad);
    else {
      if (dato in dayToMinDict) {
        newTrad = index_transaction_obj(
          dayToMinDict[trad.datetime],
          trad.kurs,
          trad.invest
        );
      } else {
        // hvis jeg ikke finner trad, må jeg gjøre noe lurt.
        const ekstremal = ekstremalpunkter(
          values,
          values.length - 1,
          values.length
        );
        let nearestMin;
        if (ekstremal.bunnpunkt.close > trad.kurs)
          nearestMin = ekstremal.bunnpunkt;
        else nearestMin = ekstremal.toppunkt;
        newTrad = index_transaction_obj(
          nearestMin.datetime,
          nearestMin.close,
          trad.invest
        );
        console.log(
          "finner ikke trad:",
          trad,
          "Gjør en tilnærmning og velger",
          nearestMin
        );
      }
      min_trads.push(newTrad);
    }
  });
  return min_trads;
};

const samtidig_kurser = (data_values, trads, tilnærming = false) => {
  let new_trads = [];
  for (let i = 0; i < trads.length; i++) {
    const trad = trads[i];
    const date = trad.datetime;
    // if(date.length < 18) continue
    const index = datetime_to_index(data_values, date, true);
    if (data_values[index].datetime !== date)
      console.log(
        "Jeg finner ikke handel",
        trad.datetime,
        "velger",
        data_values[index].datetime
      ); //'Velger', data_values[index].datetime)
    const data = data_values[index];
    let kurs;
    if (!tilnærming) kurs = data.close;
    else if (trad.handelsRate === "open")
      kurs = data.open; //, console.log(trad)
    else kurs = trad.handelsRate * (data.high - data.low) + data.low;

    const new_trad = {
      datetime: data.datetime,
      kurs: kurs,
      invest: trad.invest,
    };
    new_trads.push(new_trad);
  }
  return new_trads;
};
//data_obj, index_values, start_index, picker_strats, picker_days
//jeg må finne ut hvilken aksje som er trending.
//så må jeg finne samme tidspunkt for gitt aksje
const samtidig_kurser_flere_aksjer = (
  data_obj,
  min_data,
  trads,
  index_values,
  start_index,
  picker_strats,
  picker_days
) => {
  //
  let multiTrads = [];
  const tradDict = grouo_dayTrads(trads);
  let valgt_strat = choose_strat(
    index_values,
    picker_strats,
    start_index - 1 - picker_days,
    start_index - 1
  ); //velger fra gårsdagen. Derf
  let symbol = stockPicker(
    data_obj,
    start_index - 1,
    valgt_strat.n_days,
    valgt_strat.SD_vekting
  );
  let valgt_aksje = min_data[symbol].values;
  Object.keys(tradDict).forEach((date) => {
    const dayTrads = tradDict[date];

    if (dayTrads[0].invest) {
      // jeg vil bare velge aksjer når jeg kjøper. Eller første gang
      const marked_index = datetime_to_index(index_values, date, true, false);
      valgt_strat = choose_strat(
        index_values,
        picker_strats,
        marked_index - 1 - picker_days,
        marked_index - 1
      ); //velger fra gårsdagen. Derf
      symbol = stockPicker(
        data_obj,
        marked_index - 1,
        valgt_strat.n_days,
        valgt_strat.SD_vekting
      );
      valgt_aksje = min_data[symbol].values;
    }
    const min_values_today = slice_datoer(valgt_aksje, date, date, 0);
    // console.log(date, min_values_today[0].datetime, min_values_today.slice(-1)[0].datetime)
    const remove_index = datetime_to_index(valgt_aksje, date, false, false);
    min_data[symbol].values.splice(0, remove_index);
    const newTrads = samtidig_kurser(min_values_today, dayTrads, false);
    newTrads.forEach((trad) => {
      trad.symbol = symbol;
    });

    multiTrads.push(...newTrads);
  });
  return multiTrads;
};

const calculate_portfolio = (data_values, trads) => {
  let invested = true;
  let portfolio = [
    {
      close: data_values[0].close,
      datetime: data_values[0].datetime,
    },
  ];
  let kapital;
  const tradDict = grouo_dayTrads(trads);

  for (let i = 1; i < data_values.length; i++) {
    const data = data_values[i];
    kapital = portfolio.slice(-1)[0].close;
    if (data.datetime in tradDict) {
      const dayTrads = tradDict[data.datetime];
      kapital =
        kapital *
        change_day_trads(
          data,
          data_values[i - 1],
          dayTrads,
          !dayTrads[0].invest
        );
      invested = dayTrads.slice(-1)[0].invest;
    } else if (invested === true)
      kapital = (kapital * data.close) / data_values[i - 1].close;
    else if (invested === false) kapital = portfolio.slice(-1)[0].close;

    portfolio.push({
      close: kapital,
      datetime: data.datetime,
    });
  }
  return portfolio;
  // let valgt_strat = choose_strat(index_values, strategisett,start_index-1-indicator_n,start_index-1)
};

const calculate_multi_portfolio = (
  data_obj,
  start_index,
  trads,
  index_values,
  picker_strats,
  picker_days
) => {
  let symbol = trads[0].symbol;
  let symboler = [symbol];
  let data_values = data_obj[symbol].values;
  let invested = true;
  let portfolio = [
    {
      close: 1,
      datetime: data_values[start_index].datetime,
    },
  ];
  let kapital;
  let lastChange = start_index;
  const tradDict = grouo_dayTrads(trads);

  let yeasterday = data_values[start_index];
  for (let i = start_index + 1; i < data_values.length; i++) {
    let data = data_values[i];
    kapital = portfolio.slice(-1)[0].close;
    if (data.datetime in tradDict) {
      const dayTrads = tradDict[data.datetime];
      symbol = dayTrads[0].symbol;
      data_values = data_obj[symbol].values;
      lastChange = i;
      data = data_values[i];
      kapital =
        kapital *
        change_day_trads(data, yeasterday, dayTrads, !dayTrads[0].invest);
      invested = dayTrads.slice(-1)[0].invest;
      if (invested === true) lastChange = i;
    } else if (invested === true) {
      if (i - lastChange >= 30) {
        const marked_index = datetime_to_index(
          index_values,
          data_values[i].datetime,
          true,
          false
        );
        const pickerStrat = choose_strat(
          index_values,
          picker_strats,
          marked_index - 1 - picker_days,
          marked_index - 1
        ); //velger fra gårsdagen. Derf
        symbol = stockPicker(
          data_obj,
          marked_index - 1,
          pickerStrat.n_days,
          pickerStrat.SD_vekting
        );
        data_values = data_obj[symbol].values;
        lastChange = i;
        data = data_values[i];
      }
      if (
        i + 1 !== data_values.length &&
        data_values[i + 1].datetime in tradDict
      ) {
        const dayTrads = tradDict[data_values[i + 1].datetime];
        symbol = dayTrads[0].symbol;
        data_values = data_obj[symbol].values;
        data = data_values[i];
      }
      kapital = (kapital * data.close) / data_values[i - 1].close;
    } else if (invested === false) kapital = portfolio.slice(-1)[0].close;
    symboler.push(symbol);
    portfolio.push({
      close: kapital,
      datetime: data.datetime,
    });
    yeasterday = data;
  }
  return { portfolio: portfolio, symboler: symboler };
  // let valgt_strat = choose_strat(index_values, strategisett,start_index-1-indicator_n,start_index-1)
};

const initilize_algo = async () => {
  const start_index = 150;
  const data = await hent_data(
    ["NDX"],
    "2022-01-01",
    "2022-04-01",
    "1day",
    start_index
  );
  const min_data = await hent_data(
    ["NDX"],
    "2022-01-01",
    "2022-04-01",
    "1min",
    0
  );
};
// initilize_algo()
