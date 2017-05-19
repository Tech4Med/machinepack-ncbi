module.exports = {

  friendlyName: 'Get summary',

  description: 'Use ESummary NCBI API to return document summaries for a list of UIDs or for a search query.',

  cacheable: true,

  inputs: {
    db: {
      description: 'The database',
      example: 'pubmed',
      required: true
    },
    id: {
      description: 'UID list of documents',
      example: [15718680, 157427902, 119703751],
    },
		query: {
      description: 'The search query',
      example: 'science[journal]+AND+breast+cancer+AND+2008[pdat]'
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
      description: 'Returns summaries of documents.',
      example: [{}]
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

		if (_.isUndefined(inputs.id)) {
      Machine.build(require('./search-articles-uid'))({

        db: inputs.db,
        query: inputs.query,
        max: max,
        start: start

      }).exec({

        error: function (err) {
          return exits.error(err)
        },

        success: function (res) {
					id = res.idlist
          getSummaries(id)
        }
      })
    } else {
			getSummaries (inputs.id)
		}
		
		function getSummaries (id) {
			Http.sendHttpRequest({
				baseUrl: Machine.build(require('./get-base-url')).execSync(),
				method: 'GET',
				url: '/esummary.fcgi',
				enctype: 'application/json',
				qs: {
					db: inputs.db,
					id: _.join(id, ','),
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

						result = _.reduce(responseBody.result, function (memo, doc, key) {
							if (key === 'uids') {
								return memo
							}

							memo.push(doc)
							return memo
						}, [])
					} catch (e) {
						return exits.error('Unexpected response from NCBI API:\n' + util.inspect(responseBody, false, null) + '\n\nParse error:\n' + util.inspect(e))
					}

					return exits.success(result)
				}

			})
		}
  }

}
