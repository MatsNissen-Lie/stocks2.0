class strat_class {
  constructor(
    navn,
    stigning,
    volitilitet,
    stoploss,
    falltid,
    cooldown,
    stigetid,
    buy
  ) {
    this.symbol = navn;

    this.stoploss = stoploss;
    this.falltid = falltid;
    this.cooldown = cooldown;
    this.stigetid = stigetid;
    this.buy = buy;
    this.stigning = stigning;

    this.volitilitet = volitilitet;
    this.avvik = 0;
    this.use = 0;
  }
  regnAvvik(stig, vol) {
    let avvikStig = Math.abs(this.stigning - stig) / Math.abs(stig);
    let avvikVol = Math.abs(this.volitilitet - vol) / Math.abs(vol);
    this.avvik = avvikStig + avvikVol;
  }
  bruk() {
    this.use += 1;
  }
}
const newStrat = (
  array,
  navn,
  stigning,
  volitilitet,
  stoploss,
  falltid,
  cooldown,
  stigetid,
  buy
) => {
  array.push(
    new strat_class(
      navn,
      stigning,
      volitilitet,
      stoploss,
      falltid,
      cooldown,
      stigetid,
      buy
    )
  );
};

let NDX_strategisett = {
  strats: [],
  meta: {
    indicator: 141,
    buy: 25,
    cool: 6,
  },
};

// newStrat(NDX_strategisett.strats, 'Alleværs2', 0.067, 0.87, 0.015, 2, 1, 1, 0) //generell
// newStrat(NDX_strategisett.strats, 'resesjon2008', 0, 1.734, 0.065, 6, 7, 11, 0.02)
// newStrat(NDX_strategisett.strats, 'volitilBonanza2020-2022', 0.15, 2, 0.01, 1, 1, 1, 0)

newStrat(NDX_strategisett.strats, "Alleværs", 0.067, 0.87, 0.01, 1, 1, 1, 0); //generell
newStrat(NDX_strategisett.strats, "Resesjon", 0, 1.734, 0.06, 4, 11, 11, 0.02);
newStrat(NDX_strategisett.strats, "Volitilitet", 0.15, 2, 0.07, 6, 8, 8, 0);

const NDX_strategisett2 = {
  strats: [],
  meta: {
    indicator: 142,
    buy: 25,
    cool: 5,
  },
};
newStrat(NDX_strategisett2.strats, "Mooore", 0.067, 0.87, 0.01, 1, 0, 1, 0); //generell

//her er strategier for å velge en aksje.
class picker_strat_class {
  constructor(navn, n_days, SD_vekting, stigning, volitilitet) {
    this.symbol = navn;
    this.n_days = n_days;
    this.SD_vekting = SD_vekting;

    this.stigning = stigning;
    this.volitilitet = volitilitet;
    this.avvik = 0;
    this.use = 0;
  }
  regnAvvik(stig, vol) {
    let avvikStig = Math.abs(this.stigning - stig) / Math.abs(stig);
    let avvikVol = Math.abs(this.volitilitet - vol) / Math.abs(vol);
    this.avvik = avvikStig + avvikVol;
  }
  bruk() {
    this.use += 1;
  }
}
const newSPstrat = (array, navn, n_days, SD_vekting, stigning, volitilitet) => {
  array.push(
    new picker_strat_class(navn, n_days, SD_vekting, stigning, volitilitet)
  );
};
let picker_strats = [];
const picker_days = 52;
newSPstrat(picker_strats, "2020-22", 24, 0, 1, 1);

// newSPstrat(picker_strats, '2020-22', 25, 1.1, 0.14, 1.21)
// newSPstrat(picker_strats, '2012-14', 13, 2, 0.09, 0.66)
// newSPstrat(picker_strats, '2008-10', 32, 0.8, 0.01, 1.54)
// newSPstrat(picker_strats, 'allværs', 17, 2.5, 0.07, 0.95)

//henter transkjsoner fra csv
let transaksjonerDegiro = {};
let transaksjonerChart = {};

produkt_til_symbol = {
  "MICROSOFT CORPORATION": "MSFT",
  "APPLE INC. - COMMON ST": "AAPL",
  "ALPHABET INC. - CLASS A": "GOOGL",
  //osv
};

class transaksjon {
  constructor(
    produkt,
    symbol,
    datetime,
    antall,
    invest,
    handling,
    kurs,
    valuttakurs,
    kurtasje
  ) {
    this.datetime = datetime;
    this.handling = handling;
    this.produkt = produkt;
    this.symbol = symbol;
    this.antall = antall;
    this.invest = invest;
    this.kurs = kurs;
    this.valuttakurs = valuttakurs;
    this.kurtasje = kurtasje;
  }
  // angiSymbol(){
  //     this.symbol = produkt_til_symbol[this.produkt]
  // }
}

const hentTransaksjoner = async (navn, transaksjonerDegiro) => {
  const response = await fetch("/transaksjoner/" + navn); //ZonAnn.Ts+dSST
  const data = await response.text();
  const rows = data.split("\n");
  rows.splice(0, 1);
  rows.pop();
  rows.forEach((row) => {
    let info = row.split(",");

    const produkt = info[2];
    const symbol = produkt_til_symbol[produkt];
    const date = info[0];
    const dateFormatted = date.split("-").reverse().join("-");
    const datetime = dateFormatted + " " + info[1] + ":00";
    const antall = Number(info[6]);

    let invest = true;
    let handling = "buy"; //legger på en buy / sell
    if (antall < 0) {
      handling = "sell";
      invest = false;
    }

    const kurs = Number(info[7]);
    const valuttakurs = Number(info[13]);
    const kurtasje = Number(info[14]);

    if (!transaksjonerDegiro[symbol]) {
      transaksjonerDegiro[symbol] = [];
    }
    transaksjonerDegiro[symbol].push(
      new transaksjon(
        produkt,
        symbol,
        datetime,
        antall,
        invest,
        handling,
        kurs,
        valuttakurs,
        kurtasje
      )
    );
  });
  // console.log(transaksjonerDegiro)
};
// await hentTransaksjoner('test.csv',transaksjonerDegiro)
// await hentTransaksjoner('TransactionsHokon.csv',transaksjonerDegiro)
// await hentTransaksjoner('TransactionsMats.csv',transaksjonerDegiro)

const sortertTrans = async () => {
  await hentTransaksjoner("TransactionsFar.csv", transaksjonerDegiro);
  await hentTransaksjoner("Transactions.csv", transaksjonerDegiro);
  Object.values(transaksjonerDegiro).forEach((value) => {
    value.sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
  });
};

const averageTransaksjon = async () => {
  await sortertTrans();
  // console.log(transaksjonerDegiro)
  Object.entries(transaksjonerDegiro).forEach(([key, value]) => {
    gruper_transaskjoner = [];
    let antallAksjer = 0;
    let totalPris = 0;
    for (let i = 0; i < value.length; i++) {
      antallAksjer += value[i].antall;
      totalPris += value[i].antall * value[i].kurs;
      // console.log(value[i].datetime, key, value.length-1)
      if (
        i === value.length - 1 ||
        dagsDato(value[i].datetime) !== dagsDato(value[i + 1].datetime) ||
        value[i].invest != value[i + 1].invest
      ) {
        averagePris = totalPris / antallAksjer;
        if (
          gruper_transaskjoner.length === 0 ||
          gruper_transaskjoner[gruper_transaskjoner.length - 1].invest !==
            value[i].invest
        ) {
          gruper_transaskjoner.push({
            // handling: value[i].handling,
            datetime: value[i].datetime,
            kurs: averagePris,
            invest: value[i].invest,
            symbol: key,
          });
        }
        antallAksjer = 0;
        totalPris = 0;
      }
    }
    transaksjonerChart[key] = gruper_transaskjoner;
  });
  // console.log(transaksjonerChart)
};
averageTransaksjon();
