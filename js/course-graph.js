var width = 960,
height = 500;

var color = d3.scaleOrdinal(d3.schemeAccent);

var svg = d3.select("body").append("svg")
          .attr("viewBox", [-width / 2, -height / 2, width, height]);

let prepare_graph = function(data){  
  let node_map = data.courses.reduce((obj, x, idx) => {
    obj[x.zh_name] = idx;
    return obj;
  }, {});

  console.log(node_map);

  let nodes = data.courses.map((x, idx) => {
    return {"id": idx, "label": x.zh_name, "group": x.group || "0"}
  });

  let links = data.courses.map((x, idx)=>{    
    let required_courses = x.required || [];
    let course_relations = required_courses.map((req_name)=>{
      if (req_name in node_map){
        return {"source": node_map[req_name], "target": idx};
      } else {
        return null;
      }
    });
    return course_relations;
  }).filter((x)=>x.length > 0).flat();
  
  console.log(links);
  
  let groups = [{"leaves": [0,1,2,3,4,5]}];
  
  return {nodes, links, groups}
}

drag = simulation => {
  
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }
  
  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }
  
  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
  
  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
}


d3.json("course_list.json").then((data) => {      
  let graph = prepare_graph(data);  
  console.log(graph);
  
  const links = graph.links.map(d => Object.create(d));
  const nodes = graph.nodes.map(d => Object.create(d));

  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(50).strength(1))
      .force("charge", d3.forceManyBody().strength(-150))      
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .force("collision", d3.forceCollide(10));

  const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value));

  const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
    .data(nodes)
      .join("circle")
      .attr("r", 10)
      .attr("fill", d=>color(d.group))
      .call(drag(simulation));

  node.append("title")
      .text(d => d.label);  

  
  simulation.on("tick", () => {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
  });
  

  // invalidation.then(() => simulation.stop());
  
});
