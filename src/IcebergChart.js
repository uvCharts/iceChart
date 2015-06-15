
/* Pass d3 as dependency */
var IcebergChart = (function (d3) {
  var Chart = function (container, data) {
    // Chart physical properties
    var dimensions = {
      height: 280,
      width: 650
    };
    var margins = {
      top: 20,
      bottom: 100,
      left: 80,
      right: 40
    };

    // Chart components
    var frame = null;
    var panel = null;
    var chart = null;
    var bg = null;
    var table = null;
    var effects = {};
    var axes = {
      hor : { group: null, scale : null, func: null, axis : null, line : null, label : null },
      ver : { group: null, scale : null, func: null, axis : null, line : null, label : null }
    };

    // Chart metadata
    var barCategories = ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5'];
    var barCategoriesKeys = ['stage1', 'stage2', 'stage3', 'stage4', 'stage5'];
    var lineCategories = ['Total Pipeline', 'Stage 4+5 Target'];
    var lineCategoriesKeys = ['pipelineValue', 'targetValue'];
    var allCategories = lineCategories.concat(barCategories);
    var labels = data.pastSnapshots.map(function (d) { return d.weekOf; }).concat(data.futureMonths.map(function (d) { return d.monthOf; }));

    // Chart palette
    var palette = ['rgb(232, 81, 0)', 'rgb(145, 145, 129)', 'rgb(90, 126, 146)', 'rgb(152, 167, 5)', 'rgb(68, 71, 68)'];

    var yMax = (function (pastSnapshots, futureMonths) {
      var stage4to5Data = pastSnapshots.map(function (elmt) { return elmt.stage4Realized + elmt.stage5Realized + elmt.stage4Unrealized +  elmt.stage5Unrealized; });
      var pipelineData = futureMonths.map(function (elmt) { return elmt.pipelineValue; });
      var targetData = futureMonths.map(function (elmt) { return elmt.targetValue; });

      return d3.max([d3.max(stage4to5Data),d3.max(pipelineData),d3.max(targetData)]);
    })(data.pastSnapshots, data.futureMonths);

    var yMin = (function (data) {
      var stage1to3Data = data.pastSnapshots.map(function (elmt) { 
        return elmt.stage1Realized + elmt.stage2Realized + elmt.stage3Realized +  
          elmt.stage1Unrealized + elmt.stage2Unrealized + elmt.stage3Unrealized; 
      });
      return d3.min(stage1to3Data);
    })(data);

    frame = d3.select(container).append('div').classed('lt-iceberg-parent-div', true)
      .append('svg')
      .classed('lt-iceberg-chart', true)
      .attr('viewBox', '0 0 ' + (dimensions.width + margins.left + margins.right) + ' ' + (dimensions.height + margins.top + margins.bottom))
      .style('fill', '#bbb')
      .attr('id', 'lt-iceberg-chart-' + (+new Date()))
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('width', '100%')
      .attr('height', '100%');

    frame.append('rect').classed('chart-bg', true)
      .attr('width', dimensions.width + margins.left + margins.right)
      .attr('height', dimensions.height + margins.top + margins.bottom)
      .style('fill', '#fff');

    panel = frame.append('g').classed('chart-panel', true)
      .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');

    panel.append('rect').classed('chart-panel-bg', true)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .style('fill', '#fff');

    chart = panel.append('g').classed('chart-container', true)
      .style('opacity', 0.8);

    axes.ver.group = panel.append('g').classed('chart-vaxis', true)
      .style('shape-rendering','crispEdges');

    axes.ver.scale  = d3.scale.linear()
      .domain([yMax, yMin*1.2])
      .range([0, dimensions.height])
      .nice();

    axes.ver.func = d3.svg.axis()
      .scale(axes.ver.scale)
      .ticks(8)
      .tickSize(5, 10, 0)
      .tickPadding(5)
      .tickSubdivide(2)
      .orient('left');

    axes.ver.axis = axes.ver.group.append('g')
      .classed('chart-axis', true)
      .style('font-family', 'Arial')
      .style('font-size', '10')
      .style('font-weight', 'normal')
      .call(axes.ver.func);

    axes.ver.group.selectAll('line').style('stroke', '#333').style('opacity', 0.3);
    axes.ver.group.selectAll('text').style('fill', '#444744');

    axes.hor.group = panel.append('g').classed('chart-haxis', true)
      .attr('transform', 'translate(0,' + dimensions.height + ')')
      .style('shape-rendering','crispEdges');

    axes.hor.scale = d3.scale.ordinal()
      .rangeRoundBands([0, dimensions.width], 0.2, 0)
      .domain(labels);

    axes.hor.func = d3.svg.axis()
      .scale(axes.hor.scale)
      .tickPadding(10)
      .orient('bottom')

    axes.hor.axis = axes.hor.group.append('g')
      .attr('transform', 'translate(0, 60)')
      .style('font-family', 'Arial')
      .style('font-size', 10)
      .style('font-weight', 'normal')
      .call(axes.hor.func);

    axes.hor.axis.selectAll('path').style('fill','none');
    axes.hor.axis.selectAll('text')
      .attr('transform', 'rotate(270, -10, 8)')
      .style('fill', '#444744')
      .style('text-anchor', 'start');

    /* Initiatives table */
    table = panel.append('g')
      .attr('transform', 'translate(0, 365)')
      .classed('initiatives-table', true);

    table.selectAll('g').data(data.pastSnapshots).enter()
      .append('g')
      .attr('transform', function (d) {
        return 'translate(' + (axes.hor.scale(d.weekOf)) + ',0)';
      })
        .append('text')
        .text(function (d) { return d.noOfInitiatives; })
        .attr('transform', 'rotate(315, 4, -16)')
        .attr('font-family', 'Arial')
        .style('fill', 'rgb(232, 81, 0)')
        .attr('text-anchor', 'middle')
        /*.attr('x', function (d) { return axes.hor.scale(d.weekOf) })*/
        .attr('font-size', '10');

    table.append('text').text('No Of Initiatives')
      .attr('font-family', 'Arial')
      .attr('font-size', '10')
      .attr('dx', '-75')
      .attr('dy', '-1')
      .style('fill', 'rgb(232, 81, 0)');

    /* Stacked bars for past snapshots */
    var barGroupsWrapper = panel.append('g').classed('past-snapshots', true)
      .attr('transform', 'translate(0, ' + axes.ver.scale(0) + ')');
    
    var barGroups = [];
    for (var idx = 0, length = data.pastSnapshots.length; idx < length; idx++) {
      barGroups.push(barGroupsWrapper.append('g'));
      var bars = barGroups[idx].selectAll('g').data(barCategoriesKeys).enter().append('g');
    
      var total = 0;
      bars.append('rect')
        .attr('height', function (d) {
          return axes.ver.scale(0) - axes.ver.scale(Math.abs(data.pastSnapshots[idx][d + 'Realized'] + data.pastSnapshots[idx][d + 'Unrealized']));
        })
        .attr('value', function (d) {
          return data.pastSnapshots[idx][d + 'Realized'] + data.pastSnapshots[idx][d + 'Unrealized'];
        })
        .attr('width', axes.hor.scale.rangeBand())
        .attr('x', function (d) {return axes.hor.scale(d.name); })
        .attr('y', function (d) {
          var verticalFix = axes.ver.scale(0) - axes.ver.scale(total);
          total += Math.abs(data.pastSnapshots[idx][d + 'Realized'] + data.pastSnapshots[idx][d + 'Unrealized']);
          return verticalFix;
        })
        .style('fill', function (d, i) {
          return palette[i];
        })
        .style('stroke-width', 1)
        .style('stroke', '#fff')
        .style('stroke-opacity', 0.2);

      bars.append('svg:title')
        .text(function (d, i) {
          return data.pastSnapshots[idx][d + 'Realized'] + data.pastSnapshots[idx][d + 'Unrealized'];
        });

      yTranslateValue = Math.abs(data.pastSnapshots[idx].stage1Realized + data.pastSnapshots[idx].stage2Realized + data.pastSnapshots[idx].stage3Realized + 
        data.pastSnapshots[idx].stage1Unrealized + data.pastSnapshots[idx].stage2Unrealized + data.pastSnapshots[idx].stage3Unrealized);
      yTranslate = axes.ver.scale(0) - axes.ver.scale(yTranslateValue);

      barGroups[idx].attr('transform', 'translate(' + axes.hor.scale(data.pastSnapshots[idx].weekOf) + ', ' + yTranslate + ') scale(1, -1)');
    }

    var lineGroups = [],
      lastPastSnapshot = data.pastSnapshots[data.pastSnapshots.length - 1];
    data.futureMonths.unshift({
      monthOf: lastPastSnapshot.weekOf,
      pipelineValue: lastPastSnapshot.stage4Unrealized + lastPastSnapshot.stage5Unrealized + lastPastSnapshot.stage4Realized + lastPastSnapshot.stage5Realized,
      targetValue: lastPastSnapshot.stage4Unrealized + lastPastSnapshot.stage5Unrealized + lastPastSnapshot.stage4Realized + lastPastSnapshot.stage5Realized
    });
    for (var idx = 0, length = lineCategoriesKeys.length; idx < length; idx++) {
      /*axes.hor.scale.rangePoints([0, dimensions.width]);*/
      var linepath = panel.append('g').datum(data.futureMonths),
        linegroup = {
          path: linepath,
          func: undefined
        };

      linegroup.func = d3.svg.line()
        .x(function (d) { return axes.hor.scale(d.monthOf) + axes.hor.scale.rangeBand() + 3; })
        .y(function (d) { 
          console.log(lineCategoriesKeys[idx], d[lineCategoriesKeys[idx]]);
          return axes.ver.scale(d[lineCategoriesKeys[idx]]); 
        })
        .interpolate('cardinal');

      linegroup.path.append('path')
        .attr('d', linegroup.func)
        .style('fill', 'none')
        .style('opacity', '0.4')
        .style('stroke', '#444744')
        .style('stroke-width', 1)
        .style('stroke-dasharray', function () {
          if (idx === length - 1) {
            return "4 2";
          }
          return "none";
        });

      lineGroups.push(linegroup);
    }

    axes.hor.line = panel.append('line')
      .classed('chart-haxis-line', true)
      .attr('y1', axes.ver.scale(0))
      .attr('y2', axes.ver.scale(0))
      .attr('x1', '0')
      .attr('x2', dimensions.width)
      .style('stroke', '#888');

    panel.append('line')
      .classed('chart-vaxis-line', true)
      .attr('y1', 0)
      .attr('y2', dimensions.height)
      .style('shape-rendering', 'crispEdges')
      .style('stroke', '#888');
  };


  return Chart;
})(d3);