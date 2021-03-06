var pipelinr_util = require("../util/util.js");
var models = require('../models/models.js'); 

exports.updateValue = function(req, res) {
  var object = req.body;
  var _pipeline_id = req.params.pipeline_id;
  var _dataset_id = req.params.dataset_id;

  //console.log('Update value: ' + _pipeline_id + " in " + _dataset_id);

  var value = new models.Value({
    _dataset: _dataset_id,
    timestamp: object.timestamp,
    value: object.value,
    level: object.level
  });

  value.save(function(err, value) {
    if (err) return res.send(pipelinr_util.handleError(err));
    res.send(200);
  });

  // Save ref in dataset
	/*models.Dataset.findOneAndUpdate({_id: _dataset_id}, {$push: {"values": value._id}}, {safe: true, upsert: false})
	.exec(function (err, dataset) {
	        if (err) return res.send(pipelinr_util.handleError(err));
          if(dataset !== null) {
            value.save(function(err, value) {
              if (err) return res.send(pipelinr_util.handleError(err));
              res.send(200);
            });
          } else {
            res.send(404);
          }
	    }
	);*/
};

exports.deleteAllValues = function(req, res) {
  var object = req.body;
  var _pipeline_id = req.params.pipeline_id;
  var _dataset_id = req.params.dataset_id;

  console.log('Delete all values from: ' + _pipeline_id + " in " + _dataset_id);

  models.Value.find({ _dataset: req.params.dataset_id }, function(err, values) {
    if (err) return res.send(pipelinr_util.handleError(err));
    for(var i = 0; i < values.length; i++) {
      values[i].remove();
    }
    res.send(200, {});
  });
};