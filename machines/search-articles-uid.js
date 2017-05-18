module.exports = {

  friendlyName: 'Search articles UID',

  description: 'List articles UID which match the specified search query.',

  cacheable: true,

  inputs: {
    db: {
      description: 'The database',
      example: 'pubmed',
      required: true
    },
    query: {
      description: 'The search query',
      example: 'science[journal]+AND+breast+cancer+AND+2008[pdat]',
      required: true
    },
    max: {
      description: 'Max results by request (max = 1000)',
      example: 100
    },
    start: {
      description: 'First record to query',
      example: 10
    }
  },

  exits: {
    error: {
      description: 'Unexpected error occured.'
    },

    success: {
      description: 'Return a list of articles UID.',
      example: {
        count: 1243,
        retmax: 10,
        retstart: 5,
        idlist: [123456, 465786]
      }
    }

  },

  fn: function (inputs, exits) {
    var util = require('util')
    var _ = require('lodash')
    var Machine = require('machine')
    var Http = require('machinepack-http')

    var max = inputs.max
    var start = inputs.start

    if (_.isUndefined(inputs.max)) {
      max = 20
    }

    if (_.isUndefined(inputs.start)) {
      start = 0
    }

    Http.sendHttpRequest({
      baseUrl: Machine.build(require('./get-base-url')).execSync(),
      method: 'GET',
      url: '/esearch.fcgi',
      enctype: 'application/json',
      qs: {
        db: inputs.db,
        term: inputs.query,
        retmode: 'json',
        retmax: max,
        retstart: start
      }
    }).exec({

      error: function (err) {
        return exits.error(err)
      },

      success: function (httpResponse) {
        var responseBody
        var result

        try {
          responseBody = JSON.parse(httpResponse.body)
          result = responseBody.esearchresult
        } catch (e) {
          return exits.error('Unexpected response from NCBI API:\n' + util.inspect(responseBody, false, null) + '\n\nParse error:\n' + util.inspect(e))
        }

        return exits.success(result)
      }

    })
  }

}
