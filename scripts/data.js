//globale funksjoner
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const dagsDato = (dato) => {
  return new Date(dato).toISOString().split("T")[0];
};
const round = (tall, desimaler) => {
  n = 10 ** desimaler;
  avrundet = Math.round(tall * n) / n;
  return avrundet;
};

const datetime_to_index = (
  data,
  key,
  find_nearest = true,
  else_find_greater = true
) => {
  let start = 0;
  let end = data.length - 1;
  while (start <= end) {
    let middle = Math.floor((start + end) / 2);

    if (data[middle].datetime === key) {
      return middle; // found the key
    } else if (data[middle].datetime < key) {
      start = middle + 1; // continue searching to the right
    } else {
      end = middle - 1; // search searching to the left
    }
  }
  const nearest = [
    [data[end].datetime, end],
    [data[start].datetime, start],
  ];
  nearest.sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()); //sorterer kronologisk
  // console.log(nearest)
  if (find_nearest) {
    const timestamp = new Date(key).getTime();
    if (
      Math.abs(
        timestamp - new Date(nearest[0][0]) !=
          Math.abs(timestamp - new Date(nearest[1][0]))
      )
    ) {
      if (
        Math.abs(
          timestamp - new Date(nearest[0][0]) >
            Math.abs(timestamp - new Date(nearest[1][0]))
        )
      )
        return nearest[1][1];
      else return nearest[0][1];
    }
  }
  if (else_find_greater) return nearest[1][1];
  else return nearest[0][1];
};
const logTing = (data, intervaller = ["1week", "1day", "1min"]) => {
  function tabllInfo(intervall, start, startPrice, slutt, endPrice) {
    this.intervall = intervall;
    this.start = start;
    this.startPrice = startPrice;
    this.slutt = slutt;
    this.endPrice = endPrice;
  }
  const keys = Object.keys(data);
  tabell = {};
  intervaller.forEach((intervall) => {
    keys.forEach((key) => {
      if (intervall in data[key]) {
        const obj = new tabllInfo(
          intervall,
          data[key][intervall][0].datetime,
          data[key][intervall][0].close,
          data[key][intervall][data[key][intervall].length - 1].datetime,
          data[key][intervall][data[key][intervall].length - 1].close
        );
        tabell[key] = obj;
      }
    });
    console.table(tabell);
  });
};

//start
const fetch = require("node-fetch");
const fs = require("fs");
const prompt = require("prompt-sync")();

const saveData = (data, intervall, keys = []) => {
  if (!keys.length) keys = Object.keys(data);
  keys.forEach((key) => {
    const jsonData = JSON.stringify(data[key][intervall]);
    fs.writeFile(`./filer/${intervall + key}.json`, jsonData, (err) =>
      console.error(
        err
          ? err
          : intervall + " " + key + " data sucsessfully written to file!"
      )
    );
  });
  console.log("Data lagret.");
};

const get_stored_keys = () => {
  let files = fs.readdirSync("./filer/");
  for (let i = 0; i < files.length; i++) {
    files[i] = files[i].split(".")[0];
  }
  return files;
};
const retrieveData = (symboler = [], intervaller) => {
  if (symboler.length === 0) symboler = get_stored_keys();
  console.log("Henter data fra filer for", symboler);
  let data = {};
  symboler.forEach((symbol) => {
    data[symbol] = {};
    intervaller.forEach((intervall) => {
      try {
        const response = fs.readFileSync(
          `filer/${intervall + symbol}.json`,
          "utf-8"
        );
        const json_data = JSON.parse(response);
        data[symbol][intervall] = json_data;
      } catch {}
    });
  });
  return data;
};

// let api_data = retrieveData()
// console.log(Object.keys(api_data))

let API_key_index = 0;
let API_keys = [
  "91705186637743689009ec2e93962575",
  "24cbd865a99b4019b480fe69fde97e6a",
  "e3d73753ccb94ea994696eb924f4bdec",
];
const get_API_key = () => {
  API_key_index += 1;
  if (API_key_index === API_keys.length) API_key_index = 0;
  return API_keys[API_key_index];
};

const format_data = (data, dataIntervall) => {
  let formatted_data = {};
  let keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    if ("code" in data[keys[i]]) {
      console.log(dataIntervall, keys[i], "Det finnes ikke mer data");
      console.log(data[keys[i]]);
      return [-1, keys[i]];
    }
    let aksjeObjekt = {
      meta: data[keys[i]].meta, //Jeg tror ikke meta er nødvendig, men kan være nice.
    };

    aksjeObjekt[dataIntervall] = [];
    data[keys[i]].values.forEach((obj) => {
      //snur arrayen slik at de eldste objektene kommer først
      obj.close = Number(obj.close);
      obj.open = Number(obj.open);
      obj.high = Number(obj.high);
      obj.low = Number(obj.low);
      obj.volume = Number(obj.volume);
      aksjeObjekt[dataIntervall].push(obj);
    });

    let myVals = aksjeObjekt[dataIntervall];
    const myValsLengde = myVals.length;
    for (let i = myVals.length - 2; i > 0; i += -1) {
      if (myVals[i].datetime === myVals[i - 1].datetime) {
        myVals.splice(i, 1);
      }
    }
    if (myValsLengde !== myVals.length)
      console.log(
        "Slettet duplikater for" + keys[i],
        myValsLengde - myVals.length
      );
    aksjeObjekt[dataIntervall] = myVals;

    formatted_data[keys[i]] = aksjeObjekt;
  }
  return formatted_data;
};

let hentdata_tider = []; //ta tid og pass på at API restriksjoner ikke overskrides
const hentData = async (
  aksjeSymboler,
  startDato,
  sluttDato,
  dataIntervall = "1day"
) => {
  // henter ikke til og med.
  hentdata_tider.push(new Date().getTime());
  if (hentdata_tider.length === 8) {
    //hvis jeg har gjort 7 forespørsler til API'en, må det ha gått 60sek siden før jeg henter data igjen.
    tidsbruk =
      (hentdata_tider[hentdata_tider.length - 1] - hentdata_tider[0]) / 1000;
    // if(tidsbruk <= 60) console.log(`venter ${(60-tidsbruk)} sekunder for å ikke overbelaste API.`), await sleep((60-tidsbruk)*1000)
    hentdata_tider.splice(0, 1);
  }
  if (startDato === "" || startDato === "&outputsize=5000")
    startDato = "&outputsize=5000";
  // hvis jeg ikke ønsker å oppgi startdato henter den 5000 datapunkter.
  else startDato = `&start_date=${dagsDato(startDato)}`;

  let string_med_aksjesymboler = aksjeSymboler.join(",");
  const key = get_API_key();
  const apiURL = `https://api.twelvedata.com/time_series?symbol=${string_med_aksjesymboler}&interval=${dataIntervall}${startDato}&end_date=${sluttDato} 16:00:00&order=asc&apikey=${key}`;
  const response = await fetch(apiURL);
  const uformatertData = await response.json();

  if ("code" in uformatertData && uformatertData.code === 429) {
    console.log(uformatertData);
    console.log(`API override. Prøver igjen om 30 sekunder.`);
    await sleep(30 * 1000);
    return hentData(aksjeSymboler, startDato, sluttDato, dataIntervall);
  }
  let data = {};
  if (aksjeSymboler.length === 1) {
    data[string_med_aksjesymboler] = uformatertData;
  } //hvis jeg forespør én aksje, får jeg et annet format of må endre objektet.
  else data = uformatertData;
  if ("code" in data)
    return console.log(
      data,
      aksjeSymboler,
      startDato,
      sluttDato,
      dataIntervall
    );
  const formatted_data = format_data(data, dataIntervall);
  // console.log('–––––––')
  // logTing(formatted_data)
  // console.log('–––––––')
  return formatted_data;
};

const check_for_new_data = (data, dataIntervall) => {
  // data = await hentData(['NDX', 'AAPL', 'GOOGL', 'MSFT', 'SPX'], '2002-01-01', '2021-11-30', '1day');
  let new_data_found = false;
  const keys = Object.keys(data);
  keys.forEach((key) => {
    key_exisits = key in api_data;
    if (!key_exisits) {
      //Legger til nye aksjer som ikke har lbitt hentet før.
      new_data_found = true;
      api_data[key] = data[key];
      // console.log(api_data[key], data)
      console.log(key, "ny aksje lagt til");
    }
    intervall_exisits = dataIntervall in api_data[key];
    if (!intervall_exisits) {
      //hvis jeg nytt intervall blir lagt til
      new_data_found = true;
      api_data[key][dataIntervall] = data[key][dataIntervall];
      console.log(key, "nytt intervall lagt til");
    }
    const hentet_data = data[key][dataIntervall];
    const lagret_data = api_data[key][dataIntervall];
    if (hentet_data[0].datetime < lagret_data[0].datetime) {
      // add før.
      if (
        hentet_data[hentet_data.length - 1].datetime < lagret_data[0].datetime
      ) {
        console.log(
          "Kan ikke lagre ny data, da den ikke overlapper local data",
          key,
          dataIntervall
        );
        console.log(
          "ny data slutter",
          hentet_data[hentet_data.length - 1].datetime
        );
        console.log("lacal data starter", lagret_data[0].datetime);
        return;
      }
      new_data_found = true;
      const index = datetime_to_index(
        hentet_data,
        lagret_data[0].datetime,
        false,
        false
      );
      const ny_data = hentet_data.slice(0, index);
      console.log(
        dataIntervall,
        key,
        "ny data lagt til før",
        ny_data[ny_data.length - 1].datetime
      ); //ny_data
      api_data[key][dataIntervall] = ny_data.concat(lagret_data);
    }
    if (
      hentet_data[hentet_data.length - 1].datetime >=
      lagret_data[lagret_data.length - 1].datetime
    ) {
      // add ny data
      // console.log(key, hentet_data[hentet_data.length-1])
      if (
        hentet_data[0].datetime > lagret_data[lagret_data.length - 1].datetime
      ) {
        console.log(
          "Kan ikke lagre ny data, da den ikke overlapper local data",
          key,
          dataIntervall
        );
        console.log(
          "local data slutter",
          hentet_data[hentet_data.length - 1].datetime
        );
        console.log("ny data starter", lagret_data[0].datetime);
        return;
      }

      new_data_found = true;
      const index = datetime_to_index(
        hentet_data,
        lagret_data[lagret_data.length - 1].datetime,
        false,
        true
      );
      const ny_data = hentet_data.slice(index, hentet_data.length); // starter på index og henter én overlappende dato
      console.log(
        dataIntervall,
        key,
        "ny data lagt til etter",
        ny_data[0].datetime
      ); //ny_data
      api_data[key][dataIntervall] = lagret_data
        .slice(0, lagret_data.length - 1)
        .concat(ny_data); // det siste punktet byttes ut og lagres på nytt. Dette er for at jeg skal kunne hente data i mens markedet er åpent.
      const old_data = lagret_data.slice(0, lagret_data.length - 1);
    }
  });
  // if(new_data_found) saveData(api_data, dataIntervall), console.log(api_data)
  return new_data_found;
};
// check_for_new_data('', '1day')

const finn_tidligst_lagrede_datoer = (data, aksjeSymboler, dataIntervall) => {
  let datoer = [];
  const keys = aksjeSymboler; //Object.keys(data)
  keys.forEach((key) => {
    if (key in data && dataIntervall in data[key]) {
      const dato = data[key][dataIntervall][0].datetime;
      datoer.push(dato);
    }
  });
  datoer.sort((a, b) => new Date(a).getTime() - new Date(b).getTime()); //sorterer kronologisk
  return datoer;
};
const finn_siste_lagrede_datoer = (data, aksjeSymboler, dataIntervall) => {
  let datoer = [];
  const keys = aksjeSymboler; //Object.keys(data)
  keys.forEach((key) => {
    if (key in data && dataIntervall in data[key]) {
      const data_lst = data[key][dataIntervall];
      const dato = data_lst[data_lst.length - 1].datetime;
      datoer.push(dato);
    }
  });
  datoer.sort((a, b) => new Date(a).getTime() - new Date(b).getTime()); //sorterer kronologisk
  return datoer;
};

const get_historical_data = async (aksjeSymboler, dataIntervall, stoppDato) => {
  //forutsetter at alle aksjesymboler finnes, tror jeg. Kan bare hente data bakover i tid.
  let getIT = true;
  let ny_data_funnet = false;

  let sluttDato = finn_tidligst_lagrede_datoer(
    api_data,
    aksjeSymboler,
    dataIntervall
  );
  // console.log(sluttDato)
  if (sluttDato.length != aksjeSymboler.length) {
    //hvis markedet er åpent vil jeg ikke lagre en ufulstedig dagsdata på macen. Linje under.
    sluttDato = "2022-09-15"; //new Date().toISOString().split('T')[0]
  } else sluttDato = sluttDato[sluttDato.length - 1];

  console.log("Historisk aksjedata: henter fra", sluttDato);
  while (getIT) {
    const data = await hentData(aksjeSymboler, "", sluttDato, dataIntervall);
    if (data[0] === -1) {
      //fjerner aksjer dersom det ikke finnes data i gitt intervall.
      for (let i = 0; i < aksjeSymboler.length; i++) {
        if (aksjeSymboler[i] === data[1])
          console.log(data[1], "henter ikke mer data"),
            aksjeSymboler.splice(i, 1);
      }
      if (aksjeSymboler.length === 0) getIT = false;
      continue;
    }
    let nySluttdato = finn_tidligst_lagrede_datoer(
      data,
      aksjeSymboler,
      dataIntervall
    );
    nySluttdato = nySluttdato[nySluttdato.length - 1];
    if (sluttDato === nySluttdato) {
      //fjerner aksje dersom jeg bare henter én dag om og om igjen. Typ dead loop
      for (let i = 0; i < aksjeSymboler.length; i++) {
        if (data[aksjeSymboler[i]][dataIntervall][0].datetime === nySluttdato)
          console.log(
            aksjeSymboler[i],
            "henter ikke mer data før",
            nySluttdato
          ),
            aksjeSymboler.splice(i, 1);
      }
      if (aksjeSymboler.length === 0) getIT = false;
      continue;
    }

    if (check_for_new_data(data, dataIntervall)) ny_data_funnet = true;
    sluttDato = finn_tidligst_lagrede_datoer(
      api_data,
      aksjeSymboler,
      dataIntervall
    );
    sluttDato = dagsDato(sluttDato[sluttDato.length - 1]);
    console.log("hentet til", sluttDato);
    if (sluttDato < stoppDato) getIT = false;
  }
  // console.log(api_data)
  if (ny_data_funnet) saveData(api_data, dataIntervall);
  return ny_data_funnet;
};

const get_and_save_new_data = async (keys, intervaller) => {
  let new_data_found = false;
  for (let i = 0; i < intervaller.length; i++) {
    const intervall = intervaller[i];
    const startdato = finn_siste_lagrede_datoer(api_data, keys, intervall)[0];
    let sluttDato = new Date().toISOString().split("T")[0];

    if (startdato === undefined)
      console.log("finner ikke start dato linje 441.", startdato);

    const data = await hentData(keys, startdato, sluttDato, intervall);
    // console.log(keys, startdato, sluttDato)
    // console.log(data['NDX']['1day'].slice(-1)[0])
    if (check_for_new_data(data, intervall)) {
      console.log("Ny data lagret til", sluttDato);
      saveData(api_data, intervall);
      new_data_found = true;
    } else console.log("Ingen ny data for intervall: " + intervall);
  }
  return new_data_found;
};

const checkForStockSplit = (data) => {
  const keys = Object.keys(data);

  keys.forEach((key) => {
    const stockData = data[key];
    const intervaller = Object.keys(stockData);
    intervaller.forEach((intervall) => {
      let values = stockData[intervall];
      let correction = 0;
      let index = 0;

      for (let i = values.length - 2; i > 0; i += -1) {
        const yesterday = values[i];
        const today = values[i + 1];
        const change = Math.round(yesterday.close / today.close);
        if (correction) {
          values[i].close = round(values[i].close / correction, 5);
          values[i].open = round(values[i].open / correction, 5);
          values[i].high = round(values[i].high / correction, 5);
          values[i].low = round(values[i].low / correction, 5);
        } else if (change >= 3) {
          console.log(
            `Potensiell stock split for ${key} på ${intervall} data` +
              today.datetime,
            change
          );
          console.log("igår", yesterday);
          console.log("idag", today);
          console.log("Vil du korrigere med faktor", change);
          const ask = prompt("Korriger stockSplit? y/n");
          if (ask === "y") {
            correction = change;
            index = i;
            i++;
          }
        }
      }

      if (correction) {
        data[key][intervall] = values;
        saveData(api_data, intervall, [key]);
      }
    });
  });
};

const focuz = ["AAPL", "MSFT", "NDX", "TSLA", "GOOGL"];
const ufocuz = ["SPX", "AMZN"]; //,'BTC/USD', vix
const valgte_intervaller = ["1day", "1min", "1week"];
// const valgte_intervaller =  ['1min']
// const valgte_intervaller =  ['1day']

let api_data = {};
const kjørrr = async () => {
  api_data = retrieveData(focuz, valgte_intervaller);
  // const data = await hentData(['NDX'], '2022-03-25', '2022-03-30', '1min')
  // const val = data['NDX']['1min']
  // console.log(val)
  // const val = api_data['NDX']['1min']
  // const index = datetime_to_index(val, '2022-03-25 15:58:00')
  // console.log(val.slice(index,val.length))
  // val.splice(index+1)
  // console.log(val.slice(-1)[0])

  // const new_data_found = await get_historical_data(focuz, '1day', '2007-01-01')
  // const new_data_found = await get_historical_data(focuz, '1week', '2006-01-01')
  //   const new_data_found = await get_historical_data(focuz, "1min", "2020-03-25");
  const ask = prompt("Korriger stockSplit? y/n");
  if( ask !== "y") return;
  const new_data_found = await get_and_save_new_data(focuz, valgte_intervaller);
  // checkForStockSplit(api_data, valgte_intervaller);

  if (new_data_found)
    setTimeout(() => {
      logTing(api_data);
    }, 100);
  // logTing(api_data);
};
kjørrr();

const delete_last_day = () => {
  Object.keys(api_data).forEach((key) => {
    console.log(api_data[key]["1day"].slice(-1));
    api_data[key]["1day"].pop();
    console.log(api_data[key]["1day"].slice(-1));
  });
  saveData(api_data, "1day");
};
const delete_to_date = () => {
  const val = data["NDX"]["1min"];
  const index = datetime_to_index(val, "2022-03-31 15:59:00");
};
