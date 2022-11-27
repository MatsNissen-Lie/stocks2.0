const calcualteRsi = (data_arr, index) => {
  const n = 14;
  const data = data_arr.slice(index - n, index + 1); //henter 15 dager så jeg kan regne ut endring på 14 av dem.
  const change = data
    .map((ele, index, array) => {
      const datetime = ele.datetime;
      if (index === 0) return { close: 0, datetime };
      return { close: ele.close - array[index - 1].close, datetime };
    })
    .slice(1, data.length);
  const changeUp = change.map(({ datetime, close }) => {
    if (close > 0) return { datetime, close };
    return { datetime, close: 0 };
  });
  const changeDown = change.map(({ datetime, close }) => {
    if (close < 0) return { datetime, close };
    return { datetime, close: 0 };
  });
  console.log(changeUp);
  const emaUp = ema2(changeUp, changeUp.length - 1, 14).slice(-1)[0].ema;
  const emaDown = ema2(changeDown, changeDown.length - 1, 14).slice(-1)[0].ema;
  console.log(emaUp, emaDown);
  const RS = Math.abs(emaUp / emaDown);
  const RSI = 100 - 100 / (1 + RS);
  console.log(RS, data_arr[index].datetime);
  return RSI;
};
const addRsi = (data_arr, start_index) => {
  for (i = start_index; i < data.length; i++) {}
};

const ema2 = (data_arr, start_index, n, smoothing = 2) => {
  if (n > start_index + 1) {
    console.log(start_index, n);
    return alert("Trenger mer pre-data for å regne ut " + n + " EMA");
  }
  let EMA = [];
  const multiplier = smoothing / (1 + n);
  for (let i = start_index - n + 1; i < data_arr.length; i++) {
    const value = data_arr[i].close;
    if (EMA.length === 0)
      EMA.push({ close: value, datetime: data_arr[i].datetime });
    else {
      const EMA_yesterday = EMA[EMA.length - 1].close;
      const EMA_today = value * multiplier + EMA_yesterday * (1 - multiplier);
      EMA.push({
        close: EMA_today,
        datetime: data_arr[i].datetime,
      }); //skal jeg ha med datoer?
      if (i >= start_index) data_arr[i].ema = EMA_today;
    }
  }
  return data_arr;
};

// for et datapunkt
const standard_diviation = (data_arr, index, n) => {
  if (n > index)
    return alert("Trenger mer pre-data for å regne ut " + n + " EMA");

  let mean = 0;
  const data = data_arr.slice(index - n + 1, index + 1);
  for (let i = 0; i < data.length; i++) {
    mean += data[i].close;
  } // let TP = [] //tipical price// TP.push((data_arr[i].low+data_arr[i].high+data_arr[i].close)/3)
  mean = mean / n;

  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += Math.pow(data[i].close - mean, 2);
  } //TP[i-index+n]
  const diviation = Math.sqrt(sum / n - 1);
  const SD_percent = diviation / data[data.length - 1].close;
  data_arr[index].SD = diviation;
  return { MA: mean, SD: diviation, SD_percent: SD_percent };
};

const bollingerBands2 = (data_arr, start_index, n, m) => {
  //vanlig: m=2
  if (n > start_index)
    return alert("Trenger mer pre-data for å regne ut " + n + " EMA");

  let bollingerBands = [];
  for (let i = start_index; i < data_arr.length; i++) {
    const data = standard_diviation(data_arr, i, n);
    const { SD, MA } = data;
    data_arr.bands = [MA - m * SD, MA, MA + m * SD];
  }
  return bollingerBands;
};

const ekstremalpunkter2 = (data_arr, index, n) => {
  if (n > start_index)
    return alert("Trenger mer pre-data for å regne ut " + n + " EMA");

  let data = [];
  for (let i = index - n + 1; i < index + 1; i++) {
    let ele = data_arr[i];
    ele.index = i;
    data.push(ele);
  }
  data.sort((a, b) => a.close - b.close);
  return { bunnpunkt: data[0], toppunkt: data.slice(-1)[0] };
};

const indicators2 = (data, start_index, slutt_index) => {
  const SD_percent =
    standard_diviation(data, slutt_index, slutt_index - start_index)
      .SD_percent * 100;
  const avkastning =
    (data[slutt_index].close / data[start_index].close - 1) * 100;
  return { SD_percent: SD_percent, avkastning: avkastning };
};
const mean_indicators2 = (data, start_index, slutt_index) => {
  let volitilitet = 0;
  let stigning = 0;
  let teller = 0;
  for (let i = start_index; i < slutt_index; i++) {
    volitilitet += Math.abs(data[i + 1].close / data[i].close - 1);
    stigning += data[i + 1].close / data[i].close - 1;
    teller += 1;
  }
  volitilitet = (volitilitet / teller) * 100;
  stigning = (stigning / teller) * 100;
  return { volitilitet: volitilitet, stigning: stigning };
};

//gamle
const ema = (data_arr, start_index, n, smoothing = 2) => {
  if (n > start_index)
    return alert("Trenger mer pre-data for å regne ut " + n + " EMA");
  let EMA = [];
  const multiplier = smoothing / (1 + n);
  for (let i = start_index - n; i < data_arr.length; i++) {
    const value = data_arr[i].close;
    if (EMA.length === 0)
      EMA.push({ close: value, datetime: data_arr[i].datetime });
    else {
      const EMA_yesterday = EMA[EMA.length - 1].close;
      const EMA_today = value * multiplier + EMA_yesterday * (1 - multiplier);
      EMA.push({
        close: EMA_today,
        datetime: data_arr[i].datetime,
      }); //skal jeg ha med datoer?
      data_arr[i].ema = EMA_today;
    }
  }
  return EMA.slice(n, EMA.length); //.slice(100,EMA.length)
};

const bollingerBands = (data_arr, start_index, n, m) => {
  //vanlig: m=2
  if (n > start_index)
    return alert("Trenger mer pre-data for å regne ut " + n + " EMA");
  let bollingerBands = [];
  for (let i = start_index; i < data_arr.length; i++) {
    const data = standard_diviation(data_arr, i, n);
    const SD = data.SD;
    const MA = data.MA;
    const bands = [MA - m * SD, MA, MA + m * SD];
    const obj = {
      datetime: data_arr[i].datetime,
      bands: bands,
      //   SD: SD,
    };
    bollingerBands.push(obj);
    data_arr.bands = bands;
  }
  return bollingerBands;
};
const ekstremalpunkter = (data_arr, index, n) => {
  //close price?
  let data = [];
  for (let i = index - n + 1; i < index + 1; i++) {
    let ele = data_arr[i];
    ele.index = i;
    data.push(ele);
  }
  data.sort((a, b) => a.close - b.close);
  return { bunnpunkt: data[0], toppunkt: data.slice(-1)[0] };
};

const indicators = (data, start_index, slutt_index) => {
  const SD_percent =
    standard_diviation(data, slutt_index, slutt_index - start_index)
      .SD_percent * 100;
  const avkastning =
    (data[slutt_index].close / data[start_index].close - 1) * 100;
  return { SD_percent: SD_percent, avkastning: avkastning };
};
const mean_indicators = (data, start_index, slutt_index) => {
  let volitilitet = 0;
  let stigning = 0;
  let teller = 0;
  for (let i = start_index; i < slutt_index; i++) {
    volitilitet += Math.abs(data[i + 1].close / data[i].close - 1);
    stigning += data[i + 1].close / data[i].close - 1;
    teller += 1;
  }
  volitilitet = (volitilitet / teller) * 100;
  stigning = (stigning / teller) * 100;
  return { volitilitet: volitilitet, stigning: stigning };
};
