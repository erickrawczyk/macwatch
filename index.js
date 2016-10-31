'use strict'

const fs      = require('fs');
const osmosis = require('osmosis');

var formattedListings = [];

getListings('15')
  .then(getListings) // implied 13"
  .then(filterListings)
  .then(writeListings)
  .then(result => console.log(result))
  .catch(err => console.error(err))


function getListings(size) {
  size = size || '13'

  return new Promise((resolve, reject) => {
    let config = {
      url: 'http://www.apple.com/shop/browse/home/specialdeals/mac/macbook_pro/',
      selector: '.product',
      schema: { 'title': '.specs > h3', 'specs': '.specs', 'price': '.purchase-info' }
    }
    osmosis
      .get(config.url + size)
      .find('.product')
      .set(config.schema)
      .data(formatListing)
      .error(reject)
      .done(resolve)
  })
}

function formatListing(listing) {
    let specs = listing.specs.split('\n')
    var formatted = {
      title:   listing.title,
      price:   listing.price.match(/^\$[0-9]+,?[0-9]+\.[0-9]{2,2}/)[0].replace(',', ''),
      cpu:     listing.title.match(/i[0-9]/),
      speed:   listing.title.match(/[0-9]\.[0-9]GHz/g),
      ram:     specs[8].trim().match(/[0-9]+GB/),
      storage: specs[9].match(/[0-9]+(GB|TB)/)[0] + ' ' + (specs[9].indexOf('flash') !== -1 ? 'SSD' : 'HDD'),
      model:   specs[6].trim().replace('Originally released ', ''),
      res:     specs[7].match(/[0-9]+-by-[0-9]+/)[0].replace('-by-', ' x '),
      video:   specs[11].trim()
    }
    formattedListings.push(formatted)
}

function filterListings() {
  return new Promise((resolve, reject) => {
    let sorted = formattedListings
      .filter(elm => +elm.model.match(/[0-9]+/)[0] >= 2015)
      .sort((i, j) => +i.price.replace(/\D/g, '') > +j.price.replace(/\D/g, '') )
    resolve(sorted)
  })
}

function writeListings(listings) {
   var csv = ''
  csv += Object.keys(listings[0]).join(',') + '\n';
  listings.forEach((elm) => {
    var row = ''
    for ( let prop in elm ) { row += elm[prop] + ',' }
    csv += row.slice(0, -1) + '\n'
  })

  return new Promise((resolve, reject) => {
    fs.writeFile("./MacBookRefurbs.csv", csv, function(err) {
      if (err) { return reject(err) }
      resolve('File Exported!')
    });
  })
}
