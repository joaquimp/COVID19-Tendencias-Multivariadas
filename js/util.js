//Data processing
function readData(callback) {
    d3.json("/data/countries.json").then(function(json) {
        callback({countries: json});
    }).catch(function(error) {
        callback(null);
        console.log(error);
    })
}

function showCountriesHistory(countries) {
    data = [];
    countries.forEach(country => {
        $.get({ 
            url: `/data/${country}.json`,
            async: false
        }, function (countryData) {
            data.push(countryData);
        });
    });

    console.log(data); // agora falta implementar a exibição do gráfico com d3js
}

// HTML Generation

function makeCountriesSelection(data) {
    $.get('/templates/countriesTemplate.html', function(template) {
        $.tmpl(template, data).appendTo("#countries");
    })
}