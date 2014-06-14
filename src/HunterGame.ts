///<reference path="../stubs/d3.d.ts" />

import GraphNode = D3.Layout.GraphNode;
import GraphLink = D3.Layout.GraphLink;

module HunterGame {
    interface Graph {
        nodes: GraphNode[];
        links: GraphLink[];

        edges:{[index: number]: {[index:number]: Boolean}}
    }

    function createMatrix(n:number, m:number):Graph {
        var nodes = [];
        var links = [];
        var edges:{[index: number]: {[index:number]: Boolean}} = {};

        function addLink(link: GraphLink) {
            if (typeof edges[link.source.id] === 'undefined') edges[link.source.id] = {};
            if (typeof edges[link.target.id] === 'undefined') edges[link.target.id] = {};

            edges[link.source.id][link.target.id] = true;
            edges[link.target.id][link.source.id] = true;

            links.push(link);
        }

        var nodeMatrix = [];

        for (var i = 0; i < n; i++) {
            nodeMatrix.push([]);
            for (var j = 0; j < m; j++) {
                var node = <GraphNode>{
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
                    var link = <GraphLink> {
                        source: nodeMatrix[i][j],
                        target: nodeMatrix[i + 1][j]
                    };

                    addLink(link);
                }

                // Vertical node
                if (j + 1 < m) {
                    var link = <GraphLink> {
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

    export class GameState {
        private svg:D3.Selection;

        private force:D3.Layout.ForceLayout;
        private selectedNodes:{[index: number]: boolean} = {};
        private possibleHares:{[index: number]: boolean} = {};

        private g:Graph;

        constructor(containerId:string) {
            this.svg = d3.select("#" + containerId).append("svg")
                .attr("class", "field_svg");

            var width = this.svg.node().clientWidth;
            var height = this.svg.node().clientHeight;

            this.possibleHares[0] = true;
            this.possibleHares[1] = true;
            this.possibleHares[2] = true;
            this.possibleHares[3] = true;
            this.possibleHares[4] = true;
            this.possibleHares[5] = true;
            this.possibleHares[6] = true;
            this.possibleHares[7] = true;
            this.possibleHares[8] = true;

            this.svg = this.svg.append('g')
                .call(d3.behavior.zoom().on("zoom", () => this.zoom()));

            this.svg.append('svg:rect')
                .attr('width', width)
                .attr('height', height)
                .attr("class", "overlay");

            this.g = createMatrix(3, 3);

            this.force = d3.layout.force()
                .size([width, height])
                .nodes(this.g.nodes)
                .links(this.g.links)
                .on("tick", () => this.tick());

            this.redraw();

            this.force.start();
        }

        redraw() {
            this.spreadHairs();

            var nodes = this.force.nodes();
            var node = this.svg.selectAll(".node, .node_selected, .node_hare").data(nodes, function(d) { return d.id });

            node.enter().insert("circle", ".cursor");

            node
                .attr("class", (n: GraphNode) => {
                    if (this.selectedNodes[n.id]) {
                        return "node_selected";
                    } else if (this.possibleHares[n.id]) {
                        return "node_hare";
                    } else {
                        return "node";
                    }
                })
                .attr("r", 6)
                .on("click", (node, index) => this.onNodeClick(node));

            node.exit().remove();

            var links = this.force.links();
            var link = this.svg.selectAll(".link");

            link.data(links).enter()
                .insert("line", ".node, .node_selected, .node_hare")
                .attr("class", "link");
        }

        tick() {
            var link = this.svg.selectAll(".link");
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            var node = this.svg.selectAll(".node, .node_selected, .node_hare");
            node.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        }

        onNodeClick(node: GraphNode) {
            if (this.selectedNodes[node.id]) {
                delete this.selectedNodes[node.id];
            } else {
                this.selectedNodes[node.id] = true;
            }

            this.redraw();
        }

        zoom() {
            this.svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }

        spreadHairs() {
            var updatedHares:{[index: number]: boolean} = {};
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
        }
    }
}

