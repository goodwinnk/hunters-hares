///<reference path="../stubs/d3.d.ts" />
///<reference path="../libs/collections/collections.ts" />

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

    class Move {
        private _shots:collections.Set<number>;
        private _hares:collections.Set<number>;

        get shots(): collections.Set<number> {
            return this._shots;
        }

        get hares(): collections.Set<number> {
            return this._hares;
        }

        constructor(hares: collections.Set<number>, shots: collections.Set<number>) {
            this._shots = new collections.Set<number>();
            this._shots.union(shots);

            this._hares = new collections.Set<number>();
            this._hares.union(hares);
        }
    }

    export class GameState {
        private svg:D3.Selection;

        private force:D3.Layout.ForceLayout;

        private history:Move[] = [];
        private moveNumber = 1;

        private selectedNodes = new collections.Set<number>();
        private possibleHares = new collections.Set<number>();

        private g:Graph;

        finishMove() {
            var move = new Move(this.possibleHares, this.selectedNodes);
            if (this.history.length + 1 != this.moveNumber && this.moveNumber != 1) {
                // drop following steps
                this.history = this.history.slice(0, this.moveNumber - 1);
            }

            this.history.push(move);
            this.moveNumber++;

            this.spreadHairs();
            this.selectedNodes.clear();

            this.redraw();
        }

        previousMove() {
            if (this.moveNumber == 1) return;
            this.moveNumber--;

            var move = this.history[this.moveNumber - 1];
            this.possibleHares = move.hares;
            this.selectedNodes.clear();

            this.redraw();
        }

        nextMove() {
            if (this.moveNumber == this.history.length) return;

            this.moveNumber++;

            var move = this.history[this.moveNumber - 1];
            this.possibleHares = move.hares;
            this.selectedNodes = move.shots;

            this.redraw();
        }

        selectPreviousShots() {
            if (this.moveNumber == 1) return;

            this.selectedNodes = this.history[this.moveNumber - 1].shots;
            this.redraw();
        }

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

            var matrixHeight = 5;
            var matrixWidth = 5;

            this.g = createMatrix(matrixWidth, matrixHeight);
            for (var i = 0; i < matrixHeight * matrixWidth; i++) {
                if (i % 2 == 0) {
                    this.possibleHares.add(i);
                }
            }

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
            var node = this.svg.selectAll(".node, .node_selected, .node_hare").data(nodes, function(d) { return d.id });

            node.enter().insert("circle", ".cursor");

            node
                .attr("class", (n: GraphNode) => {
                    if (this.selectedNodes.contains(n.id)) {
                        return "node_selected";
                    } else if (this.possibleHares.contains(n.id)) {
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
            if (this.selectedNodes.contains(node.id)) {
                this.selectedNodes.remove(node.id);
            } else {
                this.selectedNodes.add(node.id);
            }

            this.redraw();
        }

        zoom() {
            this.svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }

        spreadHairs() {
            var updatedHares = new collections.Set<number>();
            for (var i = 0; i < this.g.nodes.length; i++) {
                var node = this.g.nodes[i];
                if (this.possibleHares.contains(node.id)) {
                    if (this.selectedNodes.contains(node.id)) {
                        // Killed by the shot
                        continue;
                    }

                    var adjacentNodes = this.g.edges[node.id];
                    for (var adjacentId in adjacentNodes) {
                        if (adjacentNodes.hasOwnProperty(adjacentId)) {
                            updatedHares.add(adjacentId);
                        }
                    }
                }
            }

            this.possibleHares = updatedHares;
        }
    }
}

