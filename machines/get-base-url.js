module.exports = {

  friendlyName: 'Get base URL',

  description: 'Return the base URL for the NCBI API.',

  cacheable: true,

  sync: true,

  inputs: {

  },

  exits: {

    error: {
      description: 'Unexpected error occured.'
    },

    success: {
      description: 'Done',
      example: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
    }

  },

  fn: function (inputs, exits) {
    return exits.success('https://eutils.ncbi.nlm.nih.gov/entrez/eutils')
  }

}
