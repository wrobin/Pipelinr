'use strict';

/**
 * @ngdoc directive
 * @name pipelinrApp.directive:pipelinrDashboard
 * @description
 * # pipelinrDashboard
 */
angular.module('pipelinrApp')
  .directive('pipelinrDashboard', ['d3Service', '$window', 'DataProcessing', '$timeout', function(d3Service, $window, DataProcessing, $timeout) { // Use timeout as callback that everything is rendered
    return {
      restrict: 'EA',
      scope: {
      	pipeline: '=',
      	date: '=',
      	rendered: '='
      },
      templateUrl: 'views/dashboard.html',
      link: function(scope, ele, attrs) {
        d3Service.d3().then(function(d3) {
        	console.log("pipelinrDashboard");

        	// Lokal variables
  		    var color_lines = d3.scale.ordinal()
					  .range(["#16a085", "#27ae60", "#2980b9", "#8e44ad", "#f39c12", "#d35400", "#c0392b"]);

		      // Global variables via configuration object
    			var tip = d3.select("body").append("div")
						.attr("class", "tip")
						.style("opacity", 0);

          var string_color = d3.scale.ordinal()
		        .domain(["warning","error"])
		        .range(["#f1c40f", "#e74c3c"]);

 					/*
					// Functions for statistic lines in line charts
					*/

		      // Trendline
					var leastSquares = function(xSeries, ySeries) {
						var reduceSumFunc = function(prev, cur) { return prev + cur; };
						
						var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
						var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

						var ssXX = xSeries.map(function(d) { return Math.pow(d - xBar, 2); })
							.reduce(reduceSumFunc);
						
						var ssYY = ySeries.map(function(d) { return Math.pow(d - yBar, 2); })
							.reduce(reduceSumFunc);
							
						var ssXY = xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); })
							.reduce(reduceSumFunc);
							
						var slope = ssXY / ssXX;
						var intercept = yBar - (xBar * slope);
						var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);
						
						return [slope, intercept, rSquare];
					}

					var calculateSeries = function(values) {
							var series = {
								xSeries: d3.range(1, values.length + 1),
								ySeries: values.map(function(d) { return +d.value; })
							}
							return series;
					}

					var trendCoordinates = function(xSeries, leastSquaresCoeff, values) {
						var x1 = values[0].timestamp;
						var y1 = leastSquaresCoeff[0] + leastSquaresCoeff[1];
						var x2 = values[values.length - 1].timestamp;
						var y2 = leastSquaresCoeff[0] * xSeries.length + leastSquaresCoeff[1];
						return [{ timestamp: x1, value: y1 }, { timestamp: x2, value: y2 }];
					}

					// Mean, standard deviation, variance
					var calcMeanSdVar = function(values) {
					  var r = {mean: 0, variance: 0, deviation: 0}, t = values.length;
					  for(var m, s = 0, l = t; l--; s += parseInt(values[l].value));
					  for(m = r.mean = s / t, l = t, s = 0; l--; s += Math.pow(parseInt(values[l].value) - m, 2));
					  return r.deviation = Math.sqrt(r.variance = s / t), r;
					}

					/*
					// Functions for donut graph
					*/

				  var computeDonutData = function(data, max) {
						var high = (max-(max/100)*25); // Upper 25% quantile
						var low = (max-(max/100)*75); // lower 25% quantile

						var computed_data = [{count: 0, label: 'high', color: '#D24D57'}, {count: 0, label: 'med', color: '#F5D76E'}, {count: 0, label: 'low', color: '#87D37C'}];
						for (var i = data.length; --i >= 0;) {
							if(data[i].value >= high)
								computed_data[0].count++;
						  else if(data[i].value <= low)
						  	computed_data[2].count++;
						  else
						  	computed_data[1].count++;
						}
				  	return computed_data;
				  }

				  // Store the displayed angles in _current.
					// Then, interpolate from _current to the new angles.
					// During the transition, _current is updated in-place by d3.interpolate.
					var arcTween = function(a) {
					  var i = d3.interpolate(this._current, a);
					  this._current = i(0);
					  return function(t) {
					    return scope.configuration.donutGraph.arc(i(t));
					  };
					}

					scope.configuration = {
						dateWatcher: {},
						parseDate: d3.time.format('%d %m %Y, %H:%M:%S:%L').parse,
						height: {scatterplot: 45, linechart: 100, context: 25, legend: 18},
						width: {graph: 760},
						margin: {left: 50, top: 30, bottom: 50, right: 50},
						tip: tip,
						string_color: string_color,
						domain_range: [],
						ys: [],
						yAxes: [],
						xs: [],
						xAxes: [],
						main_lines: [],
						main_areas: [],
						line: {},
						brush: {},
						x_context: {},
						xAxis_context: {},
						logFilter: [{ key: "warning", value: true }, { key: "error", value: true }],
						util: { 
										leastSquares: leastSquares, 
										trendCoordinates: trendCoordinates, 
										calculateSeries: calculateSeries, 
										calcMeanSdVar: calcMeanSdVar 
									},
						donutGraph: { 
										donutPaths: [], 
										computeDonutData: computeDonutData, 
										arcTween: arcTween, 
										pie: {}, 
										arc: {} 
									}
					};

					scope.$watch('pipeline', function(newVals, oldVals) {
		        if (scope.pipeline) {
		        	if(!scope.rendered) {
			        	// Wait until everything is rendered
			        	console.log(moment().format('DD MM YYYY, HH:mm:ss:SSS'));
	  	          $timeout(function() {


	  	          	console.log(moment().format('DD MM YYYY, HH:mm:ss:SSS'));

	  	          	// Colorize line graphs
							   	d3.selectAll(".area").attr("fill",function(d,i){return d3.rgb(color_lines(i)).brighter(2);});
		    	    		d3.selectAll(".line").attr("stroke",function(d,i){return color_lines(i);});
		    	    		d3.selectAll(".circle").style("fill", function(d) { return string_color(d.level);});

    	    		    scope.hoverValue = function(value) {
										d3.select("#Id_"+value._id).transition().duration(200).attr("r", "12");
							    }

    	    		    scope.hoverOutValue = function(value) {
										d3.select("#Id_"+value._id).transition().duration(200).attr("r", "5");
							    }

							    scope.clickValue = function(value) {

							    }

					        scope.rendered = true;
	              });
					  		return scope.renderDashboard(newVals);
					  	}
		        }
					}, true);

					// Initialize scopes for children
					scope.renderDashboard = function(pipeline) {
						console.log("renderDashboard");

						// Init different dataset types followed by initialization of child directives
						scope.intdatasets = DataProcessing.getIntDatasets(pipeline);
						scope.stringdatasets = DataProcessing.getStringDatasets(pipeline);

						// Get whole domain range for all datasets
						scope.configuration.domain_range = [];
						for(var i = 0; i < pipeline.datasets.length; i++) {
							if(pipeline.datasets[i].values.length > 0) {
								scope.configuration.domain_range.push(pipeline.datasets[i].values[0]);
								scope.configuration.domain_range.push(pipeline.datasets[i].values[pipeline.datasets[i].values.length-1]);
							}
						}

						// Render context as overview for brushing + linking + zooming + panning
						scope.renderContext();
						scope.renderLegend();

						// Watch for new datum and update scope.intdatasets|stringdatasets
						// Remove old watchers, when there is a re-render
						if($window._.isFunction(scope.configuration.dateWatcher)) {
							scope.configuration.dateWatcher();
						}	
						scope.configuration.dateWatcher = scope.$watch('date', function(newVals, oldVals) {
			        if(scope.date) {
			        	console.log("Update in dashboard");	
			        	if(scope.rendered) { scope.renderDatumUpdate(newVals); }
			        }
		      	}, true);
					};

					scope.renderDatumUpdate = function(data) {
						console.log(moment().format('DD MM YYYY, HH:mm:ss:SSS'));

						scope.configuration.domain_range.push(data.value); // Adjust overall domain range

	        	var dataset_to_update = window._.find(scope.pipeline.datasets, function(dataset) { return dataset._id == data.value._dataset });
	         	dataset_to_update.values.push(data.value);

		        if(dataset_to_update.type == "string") {

	            // Append new focus circle
	            d3.select(".focus.scatter").select('g').selectAll('circle')
	              .data(dataset_to_update.values)
	              .enter().append("circle")
	              .attr("clip-path", "url(#clip)")
	              .attr('class', 'circle')
	              .style("fill", function (d) { return scope.configuration.string_color(d.level);})
	              .attr("cx", function(d) { return scope.configuration.xs[dataset_to_update._id](scope.configuration.parseDate(d.timestamp)); })
	              .attr("cy", function(d) { return scope.configuration.margin.top; })
	              .attr("r", 5)
    			      .on("mouseover", function(d) {      
						    	scope.configuration.tip.transition().duration(200).style("opacity", .9);      
						    	scope.configuration.tip.html(d.value); 
			    				// Transformation relative to the page body
				        	var matrix = this.getScreenCTM().translate(+this.getAttribute("cx"),+this.getAttribute("cy"));
		            	scope.configuration.tip.style("left", (window.pageXOffset + matrix.e) + "px").style("top", (window.pageYOffset + matrix.f + 30) + "px");
					  		})                  
					  		.on("mouseout", function(d) {       
					    		scope.configuration.tip.transition().duration(500).style("opacity", 0);   
				    		});

	            // Append new context circle
	            d3.select(".context").select('g').selectAll("circle")
	             .data(dataset_to_update.values).enter()
	             .append("circle")
	             .attr('class', 'circle')
	             .style("fill", function (d) { return scope.configuration.string_color(d.level);})
	             .attr("r", 3)
	             .attr("cy", function (d) { return scope.configuration.height.context/2; });

	            // Keep filter
	            for(var i in scope.configuration.logFilter) {
	              if(!scope.configuration.logFilter[i].value)
	                d3.selectAll("g").selectAll("circle")
	                  .filter(function(d) { return d.level === scope.configuration.logFilter[i].key; })
	                  .attr("display", "none");
	            }
	        	}

        		// Adjust overall domain range
        		scope.configuration.x_context.domain(d3.extent(scope.configuration.domain_range, function(d) { return scope.configuration.parseDate(d.timestamp); }));

		        // Move context circles
		        d3.select(".context").selectAll("circle")
		          .data(scope.stringdatasets[0].values)
		          .attr("cx", function(d) {
		               return scope.configuration.x_context(scope.configuration.parseDate(d.timestamp));
		          })
		          .attr("cy", function(d) {
		               return scope.configuration.height.context/2; 
		          });

        		// Update context axis
        		d3.select(".context").select(".x.axis2").call(scope.configuration.xAxis_context);

        		// Keep brushed, update everything
        		brushed();
        		brushend();
        		console.log(moment().format('DD MM YYYY, HH:mm:ss:SSS'));
					}

					scope.renderContext = function() {
		        var x_context = d3.time.scale().range([0, scope.configuration.width.graph]),
		            y2 = d3.scale.linear().range([scope.configuration.height.context, 0]);

		        var xAxis_context = d3.svg.axis().scale(x_context).orient("bottom").tickSize(-5, 0, 0),
		            yAxis2 = d3.svg.axis().scale(y2).orient("left");

            scope.configuration.xAxis_context = xAxis_context;

		        //x_context.domain(d3.extent(scope.stringdatasets[0].values.map(function(d) { return scope.configuration.parseDate(d.timestamp); })));
		        x_context.domain(d3.extent(scope.configuration.domain_range.map(function(d) { return scope.configuration.parseDate(d.timestamp); })));
		        y2.domain(scope.stringdatasets[0].values);

            scope.configuration.x_context = x_context;

		        scope.configuration.brush = d3.svg.brush()
		            .x(x_context)
		            .on("brush", brushed)
                .on("brushstart", brushstart)
						    .on("brushend", brushend);

		        d3.select("#context-container").selectAll("*").remove(); // Clear old elemnts. (for update, otherwise there would be multiple elements)
		       	var context = d3.select("#context-container").append("svg")
		            .attr("class", "context")
  					    .attr("width", scope.configuration.width.graph + scope.configuration.margin.left + scope.configuration.margin.right)
					    	.attr("height", scope.configuration.height.context + scope.configuration.margin.top)
			    			.append("g")
								.attr("transform", "translate(" + scope.configuration.margin.left/2 + ",0)");

		        context.selectAll('circle')
		          .data(scope.stringdatasets[0].values)
		          .enter().append("circle")
		          .attr("clip-path", "url(#clip)")
		          .attr('class', 'circle')
		          .style("fill", function (d) { return scope.configuration.string_color(d.level);})
		          .attr("cx", function (d) { return x_context(scope.configuration.parseDate(d.timestamp)); })
		          .attr("cy", function (d) { return scope.configuration.height.context/2; })
		          .attr("r", function(d){ return 3;});

		        context.append("g")
		            .attr("class", "x axis2")
		            .attr("transform", "translate(0," + scope.configuration.height.context + ")")
		            .call(xAxis_context);

		        context.append("g")
		            .attr("class", "x brush")
		            .call(scope.configuration.brush)
		          .selectAll("rect")
		            .attr("y", -6)
		            .attr("height", scope.configuration.height.context + 7);
          }

					scope.renderLegend = function() {

		        d3.select("#legend-container").selectAll("*").remove(); // Clear old elemnts. (for update, otherwise there would be multiple elements)
		       	var legendContainer = d3.select("#legend-container").append("svg")
		            .attr("class", "legend")
  					    .attr("width", scope.configuration.width.graph + scope.configuration.margin.left + scope.configuration.margin.right)
					    	.attr("height", scope.configuration.height.legend)
			    			.append("g")
								.attr("transform", "translate(" + scope.configuration.margin.left/2 + ",0)");

		        var legend = legendContainer.selectAll(".legend")
		            .data(scope.configuration.string_color.domain())
		          .enter().append("g")
		            .attr("class", "legend")
		            .attr("transform", function(d, i) { return "translate(" + i * 100 + ",0)"; });

  	        legend.append("circle")
  	        	.attr("class", "filter")
	            .attr("value", function(d) { return d })
							.attr("cx", 9)
							.attr("cy", 9)
							.attr("r", 7)
							.attr("stroke", scope.configuration.string_color)
							.attr("stroke-width", 3)
							.style("fill", scope.configuration.string_color);

		        legend.append("text")
		            .attr("x", 24)
		            .attr("y", 9)
		            .attr("dy", ".35em")
		            .text(function(d) { return d});    

		        // Filter
		        d3.selectAll(".filter").on("click", function() {

		          // Retrieve filter key
		          var level = d3.select(this).attr("value");
		          for(var i in scope.configuration.logFilter) {
		            if(scope.configuration.logFilter[i].key == level) {
		              scope.configuration.logFilter[i].value ? scope.configuration.logFilter[i].value = false: scope.configuration.logFilter[i].value = true; 
		              var display = scope.configuration.logFilter[i].value ? "inline" : "none";
		              var fill = scope.configuration.logFilter[i].value ? string_color(level) : "#FFF";

				          // Filter table
									d3.select(".dashboard-table").selectAll(".selected").each( function(){
										var tableLevel = d3.select(this).select('.table-level').html();
										var timestamp = d3.select(this).select('.table-timestamp').html();
										if(tableLevel === level) {
											if(scope.configuration.logFilter[i].value)
												d3.select(this).style("display", "table-row");
											else
												d3.select(this).style("display", "none");
										}
									});
		            }
		          }

		          // Set rect fill
		          d3.select("[value='" + level + "']").style("fill", fill);

		          // Filter circles
		          d3.selectAll("g").selectAll("circle")
		            .filter(function(d) { return d.level === level; })
		            .attr("display", display);

		        });
					}

					function brushstart() {
				    d3.select(".context").classed("selecting", true);
					}

					function brushend() {
					  //d3.select(".context").classed("selecting", !d3.event.target.empty());

						var extent = scope.configuration.brush.extent();

				    for(var i = 0; i < scope.intdatasets.length; i++) {
				    	if(scope.intdatasets[i].values.length >= 2) {

								if(scope.configuration.brush.empty())
									var extent_data = scope.intdatasets[i].values;
								else
									var extent_data = scope.intdatasets[i].values.filter(function(d) { return extent[0] <= scope.configuration.parseDate(d.timestamp) && scope.configuration.parseDate(d.timestamp) <= extent[1] });

								if(extent_data.length > 2) {
									// Redraw donut graph
									var globalMax = d3.max(scope.intdatasets[i].values, function(d) { return +d.value; } );
		      				var donut_data = scope.configuration.donutGraph.computeDonutData(extent_data, globalMax);
		      				var path = scope.configuration.donutGraph.donutPaths[scope.intdatasets[i]._id].data(scope.configuration.donutGraph.pie(donut_data));
		      				path.transition().duration(750).attrTween("d", scope.configuration.donutGraph.arcTween); // Redraw the arcs

									// Trendlines update
									var series = scope.configuration.util.calculateSeries(extent_data);			
									var leastSquaresCoeff = scope.configuration.util.leastSquares(series.xSeries, series.ySeries);						
									var trendData = scope.configuration.util.trendCoordinates(series.xSeries, leastSquaresCoeff, extent_data);
									
						      d3.select(".focus_"+scope.intdatasets[i]._id).select(".trendline").data([trendData]).attr("d", scope.configuration.line).style("display", "block");
									
						      // Maxlines update
									var max = d3.max(extent_data, function(d) { return +d.value;} );
									var maxData = [{timestamp: extent_data[0].timestamp, value: max}, {timestamp: extent_data[extent_data.length - 1].timestamp, value: max}];

						      d3.select(".focus_"+scope.intdatasets[i]._id).select(".maxline").data([maxData]).attr("d", scope.configuration.line).style("display", "block");
						      d3.select(".focus_"+scope.intdatasets[i]._id).select(".maxline-label").text("Max: " + max.toFixed(2));

						      // Minlines update
									var min = d3.min(extent_data, function(d) { return +d.value;} );
									var minData = [{timestamp: extent_data[0].timestamp, value: min}, {timestamp: extent_data[extent_data.length - 1].timestamp, value: min}];

						      d3.select(".focus_"+scope.intdatasets[i]._id).select(".minline").data([minData]).attr("d", scope.configuration.line).style("display", "block");
						      d3.select(".focus_"+scope.intdatasets[i]._id).select(".minline-label").text("Min: " + min.toFixed(2));

		      				var statistic = scope.configuration.util.calcMeanSdVar(extent_data);
						      // Meanlines update
									var meanData = [{timestamp: extent_data[0].timestamp, value: statistic.mean}, {timestamp: extent_data[extent_data.length - 1].timestamp, value: statistic.mean}];  
						      d3.select(".focus_"+scope.intdatasets[i]._id).select(".meanline").data([meanData]).attr("d", scope.configuration.line).style("display", "block");
						      d3.select(".focus_"+scope.intdatasets[i]._id).select(".meanline-label").text("Mean: " + statistic.mean.toFixed(2) );

						      // Standard deviation lines and variance update
									var sdMinData = [{timestamp: extent_data[0].timestamp, value: statistic.mean - statistic.deviation}, {timestamp: extent_data[extent_data.length - 1].timestamp, value: statistic.mean - statistic.deviation}];
						      d3.select(".focus_"+scope.intdatasets[i]._id).select(".sdminline").data([sdMinData]).attr("d", scope.configuration.line).style("display", "block");

									var sdMaxData = [{timestamp: extent_data[0].timestamp, value: statistic.mean + statistic.deviation}, {timestamp: extent_data[extent_data.length - 1].timestamp, value: statistic.mean + statistic.deviation}];    
						      d3.select(".focus_"+scope.intdatasets[i]._id).select(".sdmaxline").data([sdMaxData]).attr("d", scope.configuration.line).style("display", "block");

						      d3.select(".focus_"+scope.intdatasets[i]._id).select(".sdline-label").text("Standard Deviation: " + statistic.deviation.toFixed(2) );
						      d3.select(".focus_"+scope.intdatasets[i]._id).select(".variance-label").text("Variance: " + statistic.variance.toFixed(2) );
						    } else {
									d3.select(".focus_"+scope.intdatasets[i]._id).select(".maxline-label").text("Max: -");
						    	d3.select(".focus_"+scope.intdatasets[i]._id).select(".minline-label").text("Min: -");
									d3.select(".focus_"+scope.intdatasets[i]._id).select(".meanline-label").text("Mean: -");
									d3.select(".focus_"+scope.intdatasets[i]._id).select(".sdline-label").text("Standard Deviation: -");
						      d3.select(".focus_"+scope.intdatasets[i]._id).select(".variance-label").text("Variance: -");
						    	
						    	d3.select(".focus_"+scope.intdatasets[i]._id).select(".maxline").style("display", "none");
						    	d3.select(".focus_"+scope.intdatasets[i]._id).select(".minline").style("display", "none");
						    	d3.select(".focus_"+scope.intdatasets[i]._id).select(".meanline").style("display", "none");
						    	d3.select(".focus_"+scope.intdatasets[i]._id).select(".sdminline").style("display", "none");
						    	d3.select(".focus_"+scope.intdatasets[i]._id).select(".sdmaxline").style("display", "none");
						    	d3.select(".focus_"+scope.intdatasets[i]._id).select(".trendline").style("display", "none");
						    }

				    	}
				    }
					}

      		function brushed() {
			    	var extent = scope.configuration.brush.extent();
						d3.select(".context").selectAll('circle').classed("selected", function(d) { return extent[0] <= scope.configuration.parseDate(d.timestamp) && scope.configuration.parseDate(d.timestamp) <= extent[1]; });

						// Table update
						if(!scope.configuration.brush.empty()) {
							d3.select(".dashboard-table").selectAll("tr").each( function(d, i){
								var timestamp = d3.select(this).select('.table-timestamp').html();
								if(extent[0] <= scope.configuration.parseDate(timestamp) && scope.configuration.parseDate(timestamp) <= extent[1]) {
									d3.select(this).classed("selected", true).style("display", "table-row");
								} else {
									d3.select(this).classed("selected", false).style("display", "none");
								}
							});
						}

				    // Scatterplot update
				    scope.configuration.xs[scope.stringdatasets[0]._id].domain(scope.configuration.brush.empty() ? scope.configuration.x_context.domain() : scope.configuration.brush.extent());

				    d3.select(".focus.scatter").selectAll("g").selectAll("circle") // Move circles
				      .data(scope.stringdatasets[0].values)
				      .attr("cx",function(d){ return scope.configuration.xs[scope.stringdatasets[0]._id](scope.configuration.parseDate(d.timestamp));})
				      .attr("cy", function(d){ return scope.configuration.margin.top;});

				    d3.select(".focus.scatter").select(".x.axis").call(scope.configuration.xAxes[scope.stringdatasets[0]._id]); // Move axis

				    // Line charts update
				    for(var i in scope.configuration.main_lines) { // i = dataset._id	      
				      // Adjust Y-Axis
				      var dataToBrush = window._.find(scope.pipeline.datasets, function(dataset) { return dataset._id == i });
						  scope.configuration.ys[i].domain([0, d3.max(dataToBrush.values.map(function(d) { return +d.value; }))]);
				      d3.select(".focus_"+i).select(".y.axis").call(scope.configuration.yAxes[i]);

				      // Adjust X-Axis
				      scope.configuration.xs[i].domain(scope.configuration.brush.empty() ? scope.configuration.x_context.domain() : scope.configuration.brush.extent());
				      d3.select(".focus_"+i).select(".area").attr("d", scope.configuration.main_areas[i]);
				      d3.select(".focus_"+i).select(".line").attr("d", scope.configuration.main_lines[i]);
				      d3.select(".focus_"+i).select(".x.axis").call(scope.configuration.xAxes[i]);
				    }
          }

      	});

      }
    };
  }]);
