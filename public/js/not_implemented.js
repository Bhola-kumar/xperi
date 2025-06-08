// Create a simple gear-like visualization using D3.js
const { d3 } = window;
const chart = d3
  .select("#constructionChart")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("viewBox", "0 0 300 300")
  .append("g")
  .attr("transform", "translate(150, 150)");

// Create gear teeth
const numTeeth = 12;
const outerRadius = 80;
const innerRadius = 60;
const toothLength = 20;

const points = [];
for (let i = 0; i < numTeeth * 2; i++) {
  const angle = (i * Math.PI) / numTeeth;
  const radius = i % 2 === 0 ? outerRadius + toothLength : outerRadius;
  points.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
}

// Draw the gear
const gear = chart
  .append("path")
  .attr("d", d3.line()(points) + "Z")
  .style("fill", "#007bff")
  .style("opacity", 0.2);

// Add inner circle
chart
  .append("circle")
  .attr("r", innerRadius)
  .style("fill", "#007bff")
  .style("opacity", 0.3);

// Rotate animation
function rotate() {
  gear
    .transition()
    .duration(8000)
    .ease(d3.easeLinear)
    .attrTween("transform", () => {
      return (t) => `rotate(${t * 360})`;
    })
    .on("end", rotate);
}

rotate();

// Countdown and redirect functionality
const countdownElement = document.getElementById("countdown");
let secondsLeft = 5;

function updateCountdown() {
  countdownElement.textContent = `Redirecting to dashboard in ${secondsLeft} ${secondsLeft === 1 ? "second" : "seconds"}...`;
  if (secondsLeft === 0) {
    window.location.href = "/dashboard";
  } else {
    secondsLeft--;
    setTimeout(updateCountdown, 1000);
  }
}

// Start the countdown
updateCountdown();
