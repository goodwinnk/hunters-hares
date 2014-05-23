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

        private g:Graph;

        constructor(containerId:string) {
            this.svg = d3.select("#" + containerId).append("svg").attr("class", "field_svg");

            this.svg.append('svg:g')
                .call(d3.behavior.zoom().on("zoom", () => this.redraw()))
                .on("dblclick.zoom", null);

            this.g = createMatrix(10, 10);

            var width = this.svg.node().clientWidth;
            var height = this.svg.node().clientHeight;

            this.force = d3.layout.force()
                .size([width, height])
                .nodes(this.g.nodes)
                .on("tick", () => this.tick());

            this.redraw();

            this.force.start();
        }

        redraw() {
            var nodes = this.force.nodes();
            var node = this.svg.selectAll(".node");

            node.data(nodes).enter()
                .insert("circle", ".cursor")
                .attr("class", "node")
                .attr("r", 5);
        }

        tick() {
            var node = this.svg.selectAll(".node");
            node.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        }
    }
}

