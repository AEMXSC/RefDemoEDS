const hardCodeDomains = "https://publish-p153659-e1796191.adobeaemcloud.com/";
const domin = window.location.origin.includes("localhost")
  ? hardCodeDomains
  : hardCodeDomains;
const url = "/graphql/execute.json/global/hi-tech-component";
async function fetcData() {
  try {
    const response = await fetch(domin + url);
    const data = await response.json();
    const item = data?.data?.hiTechModelList?.items?.[0];
    const label = [item?.titleLabel, item?.descriptionLabel]; ;
    if (!item) return;
    const cardDetails = item.cardNoLabel.map((no, index) => ({
      cardNoLabel: no,
      cardTitleLabel: item.cardTitleLabel[index]?.html || "",
      cardDescriptionLabel: item.cardDescriptionLabel[index]?.html || "",
    }));
    return { cardDetails, label };
  } catch (error) {
    console.error("Error fetching hi-tech data:", error);
  }
}
export default async function decorate(block) {
  /*  Variant logic */
  const checkClasse =  block.closest(".tech-specs-features-container").classList;
  // const container = block.closest(".tech-specs-features-container");
  // const classes = block.classList;
  // const TYPE_MAP = {
  //   "tech-specs-features-type-1": { variant: "tech-specs-features-variant1" },
  //   "tech-specs-features-type-2": { variant: "tech-specs-features-variant2" },
  //   "tech-specs-features-type-3": { variant: "tech-specs-features-variant3" },
  // };
  // const matchKey = Object.keys(TYPE_MAP).find((key) => classes.contains(key));
  // const { variant } = TYPE_MAP[matchKey] || TYPE_MAP["type-1"];
  // container?.classList.add(variant);

  /* HTML */
  const wrapper = block.querySelector("div");
  wrapper.classList.add("tech-specs-features-inner-wrapper");
  const leftSide = wrapper.querySelector("div");
  leftSide.className = "tech-specs-features-left-side";
  const rightSide = document.createElement("div");
  rightSide.className = "tech-specs-features-right-side";
  wrapper.appendChild(rightSide); 
  const data = await fetcData();
  leftSide.innerHTML = `<h2>${data?.label?.[0] || ""}</h2>
    ${data?.label?.[1]?.html || ""}
  `;
  if(checkClasse.contains("tech-specs-features-variant3")){
    rightSide.innerHTML = data?.cardDetails?.map((card) => `
    <div class="tech-specs-features-card">
     <p>${card.cardNoLabel || ""}</p>
      <div class="tech-specs-features-card-content">
      ${card.cardTitleLabel || ""}
      ${card.cardDescriptionLabel || ""}
      </div>
    </div>`,
    ).join("");
  }else{
    rightSide.innerHTML = data?.cardDetails
    ?.map((card) => `<div class="tech-specs-features-card">
    <p>${card.cardNoLabel || ""}</p>
    ${card.cardTitleLabel || ""}
    ${card.cardDescriptionLabel || ""}
  </div>`,
    )
    .join("")
  }
}
