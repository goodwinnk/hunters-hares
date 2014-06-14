///<reference path="../stubs/d3.d.ts" />

import GraphNode = D3.Layout.GraphNode;
import GraphLink = D3.Layout.GraphLink;

module HunterGame {
    interface Graph {
        nodes: GraphNode[];
        links: GraphLink[];
    }

    function createMatrix(n:number, m:number):Graph {
        var nodes = [];
        var links = [];

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

                    links.push(link);
                }

                // Vertical node
                if (j + 1 < m) {
                    var link = <GraphLink> {
                        source: nodeMatrix[i][j],
                        target: nodeMatrix[i][j + 1]
                    };

                    links.push(link);
                }
            }
        }

        return {
            nodes: nodes,
            links: links
        };
    }

    export class GameState {
        private svg:D3.Selection;
        private force:D3.Layout.ForceLayout;
        private selectedNodes : {[index: number]: boolean} = {};

        private g:Graph;

        constructor(containerId:string) {
            this.svg = d3.select("#" + containerId).append("svg")
                .attr("class", "field_svg");

            var width = this.svg.node().clientWidth;
            var height = this.svg.node().clientHeight;

            this.svg = this.svg.append('g')
                .call(d3.behavior.zoom().on("zoom", () => this.zoom()));

            this.svg.append('svg:rect')
                .attr('width', width)
                .attr('height', height)
                .attr("class", "overlay");

            this.g = createMatrix(10, 10);

            this.force = d3.layout.force()
                .size([width, height])
                .nodes(this.g.nodes)
                .links(this.g.links)
                .on("tick", () => this.tick());

            this.redraw();

            this.force.start();
        }

        redraw() {
            var nodes = this.force.nodes();
            var node = this.svg.selectAll(".node, .node_selected").data(nodes, function(d) { return d.id });

            node.enter().insert("circle", ".cursor");

            node
                .attr("class", (n: GraphNode) => { return (this.selectedNodes[n.id]) ? "node_selected" : "node"; })
                .attr("r", 5)
                .on("click", (node, index) => this.onNodeClick(node));

            node.exit().remove();

            var links = this.force.links();
            var link = this.svg.selectAll(".link");

            link.data(links).enter()
                .insert("line", ".node")
                .attr("class", "link");
        }

        tick() {
            var link = this.svg.selectAll(".link");
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            var node = this.svg.selectAll(".node");
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

    }
}

