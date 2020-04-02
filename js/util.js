///////// CONFIG /////////

//URL
const countriesJsonURL      = "../data/countries.json";
//const countryHistoryURL     = "../data/${country}.json";
const countryHistoryURL     = "https://corona.lmao.ninja/v2/historical/${country}";
const countriesTemplateURL = '../templates/countriesTemplate.html';

//classes and IDs
const checkboxClass         = ".selectedCountries";
const messageNotFound       = "nenhum país selecionado. Escolha no menu lateral";
const countriesList         = "#countries";
const graphID               = "#graph";

// dimensoes do grafico
var margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 360 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

/////////

//Data processing
function readData(callback) {
    d3.json(countriesJsonURL).then(function(json) {
        callback({countries: json});
    }).catch(function(error) {
        callback(null);
        console.log(error);
    })
}

function getCountriesHistory(countries) {
    data = [];
    countries.forEach(country => {
        const url = countryHistoryURL.replace("${country}", country);
        $.get({ 
            url: url,
            async: false
        }, function (countryData) {
            data.push(countryData);
        });
    });

    registryLog("getCountriesHistory", data); // agora falta implementar a exibição do gráfico com d3js
    return data;
}

function processData(data) {
    if (data == null || data.length == 0) {
        showMessage("Problema com os dados");
        return null;
    }

    const newData = data.reduce(function(partialData, currentCountry) {
        d3.keys(currentCountry.timeline.cases).forEach(function(currentCaseDate,i) {
            const line = {
                country: currentCountry.country,
                date: new Date(currentCaseDate),
                cases: currentCountry.timeline.cases[currentCaseDate],
                deaths: currentCountry.timeline.deaths[currentCaseDate],
                recovered: currentCountry.timeline.recovered[currentCaseDate]
            }
            partialData.push(line);
        });
        return partialData;
    }, []);
    return newData;
}

function showCountriesHistory(data) {

    registryLog("showCountriesHistory", countries);
    registryLog("showCountriesHistory - DATA", data);

    // Add X axis --> it is a date format
    var x = d3.scaleLinear()
        .domain(d3.extent(data, function (d) { return d.date; }))
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(5));

    registryLog("X domain", d3.extent(data, function (d) { return d.date; }));

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d.cases; })])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    registryLog("Y domain", [0, d3.max(data, function (d) { return d.cases; })]);

    const groupedData = d3.nest() // nest function allows to group the calculation per level of a factor
        .key(function (d) { return d.country; })
        .entries(data);

    // color palette
    var countriesName = groupedData.map(function (d) { return d.key }) // list of group names
    var casesColor = d3.scaleOrdinal()
        .domain(countriesName)
        .range(['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'])

    // Draw cases line
    svg.selectAll(".line")
        .data(groupedData)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", function (d) { return casesColor(d.key) })
        .attr("stroke-width", 1.5)
        .attr("d", function (d) {
            return d3.line()
                .x(function (d) { return x(d.date); })
                .y(function (d) { return y(d.cases); })  
                (d.values)              
        })
}


// Verifica quais os países selecionados e 
function getSelectedCountries() {
    var selectedCountries = [];

    const selected = $(`${checkboxClass}:checked`);
    if (selected.length > 0) {
        selected.each(function () {
            selectedCountries.push($(this).val());
        });
        return selectedCountries;
    } else {
        showMessage(messageNotFound);
    }
    return null;
}

// atualiza os dados do grafico
function updateGraph() {
    const countries = getSelectedCountries();
    if (countries == null) return;

    var data = getCountriesHistory(countries);
    data = processData(data);

    registryLog("showCountriesHistory", countries);
    registryLog("showCountriesHistory - DATA", data);

    var x = d3.scaleLinear()
        .domain(d3.extent(data, function (d) { return d.date; }))
        .range([0, width]);

    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d.cases; })])
        .range([height, 0]);

    // Select the section we want to apply our changes to
    svg.transition();

    const groupedData = d3.nest() // nest function allows to group the calculation per level of a factor
        .key(function (d) { return d.country; })
        .entries(data);

    // color palette
    var countriesName = groupedData.map(function (d) { return d.key }) // list of group names
    var casesColor = d3.scaleOrdinal()
        .domain(countriesName)
        .range(['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'])

    svg.selectAll(".line")
        .data(groupedData)
        .exit()
        .remove()
    // Draw cases line
    svg.selectAll(".line")
        .data(groupedData)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", function (d) { return casesColor(d.key) })
        .attr("stroke-width", 1.5)
        .attr("d", function (d) {
            return d3.line()
                .x(function (d) { return x(d.date); })
                .y(function (d) { return y(d.cases); })
                (d.values)
        })
    
}


function initGraph() {
    const countries = getSelectedCountries();
    if (countries == null) return;

    var data = getCountriesHistory(countries);
    data = processData(data);
    showCountriesHistory(data);
}

// HTML Generation
function makeCountriesSelection(data) {
    $.get(countriesTemplateURL, function(template) {
        $.tmpl(template, data).appendTo(countriesList);
        initGraph();
    })
}

//Alerts and Messagens
// TODO - Melhorar implementacao usando bootstrap
function showMessage(message) {
    console.log(message);
}

// TODO -  Melhorar implementarcao
function registryLog(context, message) {
    console.log("LOG", context);
    console.log(message);
}