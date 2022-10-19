let datasets = {};
let relativ = false;
const fargeKoder = {
  MSFT: "rgba(69, 179, 52, 0.8)",
  GOOGL: "rgba(255, 229, 28, 0.8)",
  AAPL: "rgba(33, 170, 219, 0.8)",
  TSLA: "rgba(219, 33, 67, 0.8)",
  annet: "rgba(255, 99, 132, 0.8)",
};

const line_colors = [
  "rgb(33, 150, 243)",
  "rgba(66, 189, 168, 0.65)",
  "#bae755",
];
const BB_datasets = (bollingerBands, n) => {
  const BB = bollingerBands.map((obj) => {
    return obj.bands;
  });
  let lines = [[], [], []];
  bollingerBands.forEach((obj) => {
    for (let i = 0; i < obj.bands.length; i++) {
      lines[i].push({
        close: obj.bands[i],
        datetime: obj.datetime,
      });
    }
  });
  createDataset("BB low", lines[0], 0, "BB");
  createDataset("BB " + n, lines[1], 0, "BB");
  createDataset("BB high", lines[2], 0, "BB");
};
const createDataset = async (
  symbol,
  data_arr,
  start_index = 0,
  type = "aksje",
  symboler = []
) => {
  let values = [];
  let dataset;
  let lable;
  let compare = false;
  if (type === "aksje") {
    for (let i = start_index; i < data_arr.length; i++) {
      values.push({
        x: new Date(data_arr[i].datetime).getTime(),
        o: data_arr[i].open,
        h: data_arr[i].high,
        l: data_arr[i].low,
        c: data_arr[i].close,
      });
    }
    lable = type;
    dataset = {
      label: symbol,
      data: values,
    };
  } else {
    // lable = symbol
    // if(type === 'EMA' || type === 'compare' || type === 'BB') lable = symbol + type
    lable = symbol + " " + type;
    if (type === "Portfolio" || type === "BB" || type === "BB") lable = symbol;

    // //registerer grafer som er reltive.
    if (type === "compare" || type === "Portfolio") compare = true;

    //setter forskjellige farger for
    let farge;
    if (type === "Portfolio") {
      farge = [];
      symboler.forEach((key) => {
        farge.push(key in fargeKoder ? fargeKoder[key] : fargeKoder["annet"]);
      });
    } //lagre fargekoder for flere ting kan være lurt. Mindre if setning er.
    else if (symbol === "BB low" || symbol === "BB high")
      farge = "rgb(91, 156, 246)";
    else if (type === "BB") farge = "rgb(149, 117, 205)"; //midten
    else {
      farge_index = (Object.keys(datasets).length - 1) % line_colors.length;
      farge = line_colors[farge_index];
    }
    //felles for alle sub-grafer
    let parameterValues = data_arr.map((obj) => {
      return obj.close;
    });
    for (let i = start_index; i < data_arr.length; i++) {
      const datetime = new Date(data_arr[i].datetime).getTime();
      if (datetime != datasets["aksje"].data[i - start_index].x)
        console.log(
          data_arr[i].datetime,
          "Nytt dataset er tilsynelatende ikke parallelt med aksjen."
        );
      values.push({
        x: datasets["aksje"].data[i - start_index].x,
        y: round(parameterValues[i], 2),
      });
    }
    dataset = {
      label: lable,
      data: values,
      type: "line",
      borderColor: farge,
      backgroundColor: farge,
      pointRadius: type === "Portfolio" ? 2 : 1, //større punkter for Portfolio fordi for å se punkt farge.
      pointHoverRadius: 1,
    };
  }
  //feller for alle grafer
  datasets[lable] = dataset;
  datasets[lable].meta = {
    compare: compare,
    percent: false,
    orginal_verdi: values[0],
  };

  relativ_datasets(datasets);
};
const dataset_keys_to_change = (datasets, compare) => {
  let keys = [];
  Object.keys(datasets).forEach((key) => {
    if (datasets[key].meta.percent !== compare) keys.push(key);
  });
  return keys;
};
const relativ_datasets = (datasets) => {
  compare = false; // avgjør om jeg skal ha prosent eller absolutt verdier.
  Object.keys(datasets).forEach((key) => {
    if (datasets[key].meta.compare) compare = true;
  });
  const keys = dataset_keys_to_change(datasets, compare); //finner ut hvilke dataset som setemmer overens med comapre
  keys.forEach((key) => {
    let ref = datasets["aksje"].meta.orginal_verdi.c;
    if (datasets[key].meta.compare) ref = datasets[key].meta.orginal_verdi.y;
    if (compare) {
      if (key === "aksje") {
        datasets[key].data = datasets[key].data.map((d) => {
          return {
            x: d.x,
            o: d.o / ref - 1,
            h: d.h / ref - 1,
            l: d.l / ref - 1,
            c: d.c / ref - 1,
          };
        });
      } else {
        datasets[key].data = datasets[key].data.map((d) => {
          return {
            x: d.x,
            y: d.y / ref - 1,
          };
        });
      }
      datasets[key].meta.percent = true;
    } else {
      if (key === "aksje") {
        datasets[key].data = datasets[key].data.map((d) => {
          return {
            x: d.x,
            o: (d.o + 1) * ref,
            h: (d.h + 1) * ref,
            l: (d.l + 1) * ref,
            c: (d.c + 1) * ref,
          };
        });
      } else {
        datasets[key].data = datasets[key].data.map((d) => {
          return {
            x: d.x,
            y: (d.y + 1) * ref,
          };
        });
      }
      datasets[key].meta.percent = false;
    }
  });
};
// function lineData(barData) { return barData.map(d => { return { x: d.x, y: d.c} }) };

const makeChart = async () => {
  const secCanvas = document.getElementById("secCanvas");
  secCanvas.innerHTML = '<canvas id="Chart" width="400" height="400"></canvas>';
  const chartID = document.getElementById("Chart");
  const ctx = chartID.getContext("2d");

  let datasets_list = [];
  Object.keys(datasets).forEach((key) => {
    datasets_list.push(datasets[key]);
  });
  // console.log(datasets)
  // console.log(datasets_list);

  var myChart = new Chart(ctx, {
    type: "candlestick",
    data: {
      datasets: datasets_list,
    },
    options: {
      responsive: true,
      aspectRatio: 2,
      scales: {
        y: {
          beginAtZero: false,
        },
      },
      plugins: {
        legend: {
          labels: {
            // This more specific font property overrides the global property
            font: {
              size: 10,
            },
          },
        },
      },
    },
  });
};
