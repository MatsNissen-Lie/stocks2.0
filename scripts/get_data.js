const read_file = async (key) => {
  try {
    // Fetch the file content from the server
    const response = await fetch(`/filer_new/${key}.jsonl`);

    // Check if the response is OK
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    // Read the response text
    const text = await response.text();

    // Split the text by newlines to get individual JSON lines
    const lines = text.trim().split("\n");

    // Parse each JSON line into an object
    const data = lines.map((line) => JSON.parse(line));

    // Return the parsed data
    return data;
  } catch (error) {
    console.error("Error reading file:", error);
    return null;
  }
};
// hent(focuz)

const hent_data = async (
  symboler,
  start_date,
  end_date,
  intervall,
  pre_data = 0
) => {
  //note to self: Hvis jeg vil ha til og med minutt data, må jeg legge inn sekunder også
  let data = {};
  if (
    Array(end_date).length > 10 &&
    end_date.split(" ")[1].split(":").length === 2
  )
    console.log(
      "Husk at du må ha med sekunder for å få til og med ønsket minutt."
    );

  for (let i = 0; i < symboler.length; i++) {
    const local_data = await read_file(intervall + symboler[i]); // jeg må gjøre det om til en dags dato for å få til og med datoen jeg vil.
    let start_index = datetime_to_index(local_data, start_date, false, true); //henter fra og med dato
    if (start_index - pre_data < 0)
      (pre_data = start_index),
        console.log(
          symboler[i] +
            ": Ikke tilstrekklig predata. Endrer predata til " +
            pre_data,
          start_index
        );

    const sliced_values = slice_datoer(
      local_data,
      start_date,
      end_date,
      pre_data
    );
    data[symboler[i]] = {
      values: sliced_values,
      meta: {
        index: pre_data,
        intervall: intervall,
        symbol: symboler[i],
      },
    };
  }
  return data;
};
// setTimeout(async ()=> {
//     const data = await hent_data(focuz, '2021-01-01', '2022-01-01', '1day', 250)
//     console.log(data)
// }, 1000);
