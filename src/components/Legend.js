import { mapColor } from './utils';

function Legend() {
  let legendColor = mapColor().concat([[18, '#2c2e42']]);
  // console.log(legendColor)

  const legend = legendColor.map((num, i) => (
    <div key={ i } className="legend__categ">
      <div key={ num[1] } className={`legend__categ--box legend__categ--box-${i}`} style={{ background: num[1] }}></div>
      <div key={ num[0] } className={`legend__categ--text`}>
        { !i ? `${num[0]} or fewer` : num[0] }
        {
          (i === 5) ? ' or more news sources': ''
        }
      </div>
    </div>
  ));

  return (
    <div key='legend' className="legend">
      { legend }
    </div>
  )
}

export default Legend;