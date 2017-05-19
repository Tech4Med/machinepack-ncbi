module.exports = {

  friendlyName: 'Get records',

  description: 'Returns formatted data records for a list of input UIDs or for a search query.',

  cacheable: true,

  inputs: {
    db: {
      description: 'The database',
      example: 'pubmed',
      required: true
    },
    id: {
      description: 'UID list of documents',
      example: [15718680, 157427902, 119703751]
    },
    query: {
      description: 'The search query',
      example: 'science[journal]+AND+breast+cancer+AND+2008[pdat]'
    },
    retmode: {
      description: 'Can be plain text (text) or javascript object (object)',
      example: 'object'
    },
    rettype: {
      description: 'Used only if retmode=text, can be Medline (medline), PMID list (uilist) or Abstract (abstract)',
      example: 'medline'
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
      description: 'Returns summaries of documents.'
    }

  },

  fn: function (inputs, exits) {
    var util = require('util')
    var _ = require('lodash')
    var Machine = require('machine')
    var Http = require('machinepack-http')
    var parseString = require('xml2js').parseString

    var id = inputs.id
    var retmode = inputs.retmode
    var rettype = inputs.rettype
    var max = inputs.max
    var start = inputs.start

    if (inputs.retmode === 'object') {
      retmode = 'xml'
      rettype = null
    } else {
      retmode = 'text'
    }

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
          getRecords(id)
        }
      })
    } else {
			getRecords(inputs.id)
		}

    function getRecords (id) {
      Http.sendHttpRequest({
        baseUrl: Machine.build(require('./get-base-url')).execSync(),
        method: 'GET',
        url: '/efetch.fcgi',
        enctype: 'application/json',
        qs: {
          db: inputs.db,
          id: _.join(id, ','),
          retmode: retmode,
          rettype: rettype,
          retmax: inputs.max,
          retstart: inputs.start
        }
      }).exec({

        error: function (err) {
          return exits.error(err)
        },

        success: function (httpResponse) {
          var result

          if (retmode === 'text') {
            result = httpResponse.body
            return exits.success(result)
          }

          var responseBody

          try {
            parseString(httpResponse.body, function (err, res) {
              if (err) {
                return exits.error(err)
              }
              responseBody = res
            })

            result = _.reduce(responseBody.PubmedArticleSet.PubmedArticle, function (memo, doc, key) {
              memo.push(doc.MedlineCitation[0][0])
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
