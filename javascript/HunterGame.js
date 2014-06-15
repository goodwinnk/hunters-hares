///<reference path="../stubs/d3.d.ts" />
var HunterGame;
(function (HunterGame) {
    function createMatrix(n, m) {
        var nodes = [];
        var links = [];
        var edges = {};

        function addLink(link) {
            if (typeof edges[link.source.id] === 'undefined')
                edges[link.source.id] = {};
            if (typeof edges[link.target.id] === 'undefined')
                edges[link.target.id] = {};

            edges[link.source.id][link.target.id] = true;
            edges[link.target.id][link.source.id] = true;

            links.push(link);
        }

        var nodeMatrix = [];

        for (var i = 0; i < n; i++) {
            nodeMatrix.push([]);
            for (var j = 0; j < m; j++) {
                var node = {
                    id: n * j + i,
                    x: i * 50,
                    y: j * 50
                };

                nodes.push(node);
                nodeMatrix[i].push(node);
            }
        }

        for (i = 0; i < n; i++) {
            for (j = 0; j < m; j++) {
                // Horizontal node
                if (i + 1 < n) {
                    var link = {
                        source: nodeMatrix[i][j],
                        target: nodeMatrix[i + 1][j]
                    };

                    addLink(link);
                }

                // Vertical node
                if (j + 1 < m) {
                    var link = {
                        source: nodeMatrix[i][j],
                        target: nodeMatrix[i][j + 1]
                    };

                    addLink(link);
                }
            }
        }

        return {
            nodes: nodes,
            links: links,
            edges: edges
        };
    }

    var GameState = (function () {
        function GameState(containerId) {
            var _this = this;
            this.selectedNodes = {};
            this.possibleHares = {};
            this.svg = d3.select("#" + containerId).append("svg").attr("class", "field_svg");

            var width = this.svg.node().clientWidth;
            var height = this.svg.node().clientHeight;

            this.svg = this.svg.append('g').call(d3.behavior.zoom().on("zoom", function () {
                return _this.zoom();
            }));

            this.svg.append('svg:rect').attr('width', width).attr('height', height).attr("class", "overlay");

            this.g = createMatrix(5, 5);

            for (var i = 0; i < 5 * 5; i++) {
                this.possibleHares[i] = true;
            }

            this.force = d3.layout.force().size([width, height]).nodes(this.g.nodes).links(this.g.links).on("tick", function () {
                return _this.tick();
            });

            this.redraw();

            this.force.start();
        }
        GameState.prototype.redraw = function () {
            var _this = this;
            this.spreadHairs();

            var nodes = this.force.nodes();
            var node = this.svg.selectAll(".node, .node_selected, .node_hare").data(nodes, function (d) {
                return d.id;
            });

            node.enter().insert("circle", ".cursor");

            node.attr("class", function (n) {
                if (_this.selectedNodes[n.id]) {
                    return "node_selected";
                } else if (_this.possibleHares[n.id]) {
                    return "node_hare";
                } else {
                    return "node";
                }
            }).attr("r", 6).on("click", function (node, index) {
                return _this.onNodeClick(node);
            });

            node.exit().remove();

            var links = this.force.links();
            var link = this.svg.selectAll(".link");

            link.data(links).enter().insert("line", ".node, .node_selected, .node_hare").attr("class", "link");
        };

        GameState.prototype.tick = function () {
            var link = this.svg.selectAll(".link");
            link.attr("x1", function (d) {
                return d.source.x;
            }).attr("y1", function (d) {
                return d.source.y;
            }).attr("x2", function (d) {
                return d.target.x;
            }).attr("y2", function (d) {
                return d.target.y;
            });

            var node = this.svg.selectAll(".node, .node_selected, .node_hare");
            node.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        };

        GameState.prototype.onNodeClick = function (node) {
            if (this.selectedNodes[node.id]) {
                delete this.selectedNodes[node.id];
            } else {
                this.selectedNodes[node.id] = true;
            }

            this.redraw();
        };

        GameState.prototype.zoom = function () {
            this.svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        };

        GameState.prototype.spreadHairs = function () {
            var updatedHares = {};
            for (var i = 0; i < this.g.nodes.length; i++) {
                var node = this.g.nodes[i];
                if (this.possibleHares[node.id] && !this.selectedNodes[node.id]) {
                    var adjacentNodes = this.g.edges[node.id];
                    for (var adjacentId in adjacentNodes) {
                        if (adjacentNodes.hasOwnProperty(adjacentId)) {
                            if (!this.selectedNodes[adjacentId]) {
                                updatedHares[adjacentId] = true;
                            }
                        }
                    }
                }
            }

            this.possibleHares = updatedHares;
        };
        return GameState;
    })();
    HunterGame.GameState = GameState;
})(HunterGame || (HunterGame = {}));
//# sourceMappingURL=HunterGame.js.map
