const { svg2cagX, svg2cagY, cagLengthX, cagLengthY, cagLengthP, reflect, groupValue } = require('./helpers')
const { cssPxUnit } = require('./constants')

const shapesMap = function (obj, codify, params) {
  const { level, indent, on, svgUnitsPmm, svgUnitsX, svgUnitsY, svgUnitsV, svgGroups, target } = params

  const types = {
    group: (obj) => {
      let code = codify({ target }, obj)
      code += `${indent}${on} = levels.l${level + 1}\n`
      return code
    },

    rect: (obj, svgUnitsPmm, svgUnitsX, svgUnitsY) => {
      let x = cagLengthX(obj.x, svgUnitsPmm, svgUnitsX)
      let y = (0 - cagLengthY(obj.y, svgUnitsPmm, svgUnitsY))
      const w = cagLengthX(obj.width, svgUnitsPmm, svgUnitsX)
      const h = cagLengthY(obj.height, svgUnitsPmm, svgUnitsY)
      const rx = cagLengthX(obj.rx, svgUnitsPmm, svgUnitsX)
      // const ry = cagLengthY(obj.ry, svgUnitsPmm, svgUnitsY)
      let code
      if (w > 0 && h > 0) {
        x = (x + (w / 2)).toFixed(4) // position the object via the center
        y = (y - (h / 2)).toFixed(4) // position the object via the center
        if (rx === 0) {
          code = `${indent}${on} = primitives.rectangle({center: [${x}, ${y}], size: [${w / 2}, ${h / 2}]})\n`
        } else {
          code = `${indent}${on} = primitives.roundedRectangle({center: [${x}, ${y}], size: [${w / 2}, ${h / 2}], roundRadius: ${rx}})\n`
        }
        if (target === 'path') {
          code += `${indent}${on} = geometry.path2.fromPoints({closed: true}, geometry.geom2.toPoints(${on}))\n`
        }
      }
      return code
    },

    circle: (obj, svgUnitsPmm, svgUnitsX, svgUnitsY, svgUnitsV) => {
      const x = cagLengthX(obj.x, svgUnitsPmm, svgUnitsX)
      const y = (0 - cagLengthY(obj.y, svgUnitsPmm, svgUnitsY))
      const r = cagLengthP(obj.radius, svgUnitsPmm, svgUnitsV)
      let code
      if (r > 0) {
        code = `${indent}${on} = primitives.circle({center: [${x}, ${y}], radius: ${r}})\n`
        if (target === 'path') {
          code += `${indent}${on} = geometry.path2.fromPoints({closed: true}, geometry.geom2.toPoints(${on}))\n`
        }
      }
      return code
    },

    ellipse: (obj, svgUnitsPmm, svgUnitsX, svgUnitsY, svgUnitsV) => {
      const rx = cagLengthX(obj.rx, svgUnitsPmm, svgUnitsX)
      const ry = cagLengthY(obj.ry, svgUnitsPmm, svgUnitsY)
      const cx = cagLengthX(obj.cx, svgUnitsPmm, svgUnitsX)
      const cy = (0 - cagLengthY(obj.cy, svgUnitsPmm, svgUnitsY))
      let code
      if (rx > 0 && ry > 0) {
        code = `${indent}${on} = primitives.ellipse({center: [${cx}, ${cy}], radius: [${rx}, ${ry}]})\n`
        if (target === 'path') {
          code += `${indent}${on} = geometry.path2.fromPoints({closed: true}, geometry.geom2.toPoints(${on}))\n`
        }
      }
      return code
    },

    line: (obj, svgUnitsPmm, svgUnitsX, svgUnitsY, svgUnitsV) => {
      const x1 = cagLengthX(obj.x1, svgUnitsPmm, svgUnitsX)
      const y1 = (0 - cagLengthY(obj.y1, svgUnitsPmm, svgUnitsY))
      const x2 = cagLengthX(obj.x2, svgUnitsPmm, svgUnitsX)
      const y2 = (0 - cagLengthY(obj.y2, svgUnitsPmm, svgUnitsY))
      let code = `${indent}${on} = primitives.line([[${x1}, ${y1}], [${x2}, ${y2}]])\n`
      if (target === 'geom2') {
        let r = getStrokeWidth(obj, svgUnitsPmm, svgUnitsV, svgGroups)
        // TODO
      }
      return code
    },

    polygon: (obj, svgUnitsPmm, svgUnitsX, svgUnitsY) => {
      let code = `${indent}${on} = primitives.polygon({points: [\n`
      for (let j = 0; j < obj.points.length; j++) {
        const p = obj.points[j]
        if ('x' in p && 'y' in p) {
          const x = cagLengthX(p.x, svgUnitsPmm, svgUnitsX)
          const y = (0 - cagLengthY(p.y, svgUnitsPmm, svgUnitsY))
          code += `${indent}  [${x}, ${y}],\n`
        }
      }
      code += `${indent}]})\n`
      if (target === 'path') {
        code += `${indent}${on} = geometry.path2.fromPoints({closed: true}, geometry.geom2.toPoints(${on}))\n`
      }
      return code
    },

    polyline: (obj, svgUnitsPmm, svgUnitsX, svgUnitsY, svgUnitsV) => {
      let code = `${indent}${on} = geometry.path2.fromPoints({}, [\n`
      for (let j = 0; j < obj.points.length; j++) {
        const p = obj.points[j]
        if ('x' in p && 'y' in p) {
          let x = cagLengthX(p.x, svgUnitsPmm, svgUnitsX)
          let y = (0 - cagLengthY(p.y, svgUnitsPmm, svgUnitsY))
          code += `${indent}  [${x}, ${y}],\n`
        }
      }
      code += `${indent}])\n`
      if (target === 'geom2') {
        let r = getStrokeWidth(obj, svgUnitsPmm, svgUnitsV, svgGroups)
        // TODO
      }
      return code
    },

    path
  }
  return types[obj.type](obj, svgUnitsPmm, svgUnitsX, svgUnitsY, svgUnitsV, params, svgGroups)
}

module.exports = shapesMap

const getStrokeWidth = (obj, svgUnitsPmm, svgUnitsV, svgGroups) => {
  let r = cssPxUnit // default
  if ('strokeWidth' in obj) {
    r = cagLengthP(obj.strokeWidth, svgUnitsPmm, svgUnitsV) / 2
  } else {
    const v = groupValue(svgGroups, 'strokeWidth')
    if (v !== null) {
      r = cagLengthP(v, svgUnitsPmm, svgUnitsV) / 2
    }
  }
  return r
}

const getColor = (obj, target) => {
  let c
  if (target === 'path' && obj.stroke) {
    c = obj.stroke
  }
  if (target === 'geom2' && obj.fill) {
    c = obj.fill
  }
  return c
}

const path = (obj, svgUnitsPmm, svgUnitsX, svgUnitsY, svgUnitsV, params, svgGroups) => {
  const { indent, on, target } = params
  let tmpCode = `${indent}parts = []\n`

  let c = getColor(obj, target)
  let r = getStrokeWidth(obj, svgUnitsPmm, svgUnitsV, svgGroups)

  // Note: All values are SVG values
  let sx = 0 // starting position
  let sy = 0
  let cx = 0 // current position
  let cy = 0
  let pi = 0 // current path index
  let pathName = on + pi // current path name
  let pc = false // current path closed
  let bx = 0 // 2nd control point from previous C command
  let by = 0 // 2nd control point from previous C command
  let qx = 0 // 2nd control point from previous Q command
  let qy = 0 // 2nd control point from previous Q command

  for (let j = 0; j < obj.commands.length; j++) {
    let co = obj.commands[j]
    let pts = co.p
    // console.log('postion: ['+cx+','+cy+'] before '+co.c);
    switch (co.c) {
      case 'm': // relative move to X,Y
        // special case, if at beginning of path then treat like absolute M
        if (j === 0) {
          cx = 0; cy = 0
        }
        // complete the previous path
        if (pi > 0 && pc === false) {
          tmpCode += `${indent}parts.push(${pathName})\n`
        }
        // open a new path
        if (pts.length >= 2) {
          cx = cx + parseFloat(pts.shift())
          cy = cy + parseFloat(pts.shift())
          pi++
          pc = false
          pathName = on + pi
          tmpCode += `${indent}${pathName} = geometry.path2.fromPoints({}, [[${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]])\n`
          sx = cx; sy = cy
        }
        // optional implicit relative lineTo (cf SVG spec 8.3.2)
        while (pts.length >= 2) {
          cx = cx + parseFloat(pts.shift())
          cy = cy + parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendPoints([${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}], ${pathName})\n`
        }
        break
      case 'M': // absolute move to X,Y
        // complete the previous path
        if (pi > 0 && pc === false) {
          tmpCode += `${indent}parts.push(${pathName})\n`
        }
        // open a new path
        if (pts.length >= 2) {
          cx = parseFloat(pts.shift())
          cy = parseFloat(pts.shift())
          pi++
          pc = false
          pathName = on + pi
          tmpCode += `${indent}${pathName} = geometry.path2.fromPoints({}, [[${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]])\n`
          sx = cx; sy = cy
        }
        // optional implicit absolute lineTo (cf SVG spec 8.3.2)
        while (pts.length >= 2) {
          cx = parseFloat(pts.shift())
          cy = parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendPoints([${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}], ${pathName})\n`
        }
        break
      case 'a': // relative elliptical arc
        while (pts.length >= 7) {
          let rx = parseFloat(pts.shift())
          let ry = parseFloat(pts.shift())
          let ro = 0 - parseFloat(pts.shift()) * 0.017453292519943295
          let lf = (pts.shift() === '1')
          let sf = (pts.shift() === '1')
          cx = cx + parseFloat(pts.shift())
          cy = cy + parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendArc({endpoint: [${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}], radius: [${svg2cagX(rx, svgUnitsPmm)}, ${svg2cagY(ry, svgUnitsPmm)}], xaxisrotation: ${ro}, clockwise: ${sf}, large: ${lf}}, ${pathName})\n`
        }
        break
      case 'A': // absolute elliptical arc
        while (pts.length >= 7) {
          let rx = parseFloat(pts.shift())
          let ry = parseFloat(pts.shift())
          let ro = 0 - parseFloat(pts.shift()) * 0.017453292519943295
          let lf = (pts.shift() === '1')
          let sf = (pts.shift() === '1')
          cx = parseFloat(pts.shift())
          cy = parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendArc({endpoint: [${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}], radius: [${svg2cagX(rx, svgUnitsPmm)}, ${svg2cagY(ry, svgUnitsPmm)}], xaxisrotation: ${ro}, clockwise: ${sf}, large: ${lf}}, ${pathName})\n`
        }
        break
      case 'c': // relative cubic Bézier
        while (pts.length >= 6) {
          let x1 = cx + parseFloat(pts.shift())
          let y1 = cy + parseFloat(pts.shift())
          bx = cx + parseFloat(pts.shift())
          by = cy + parseFloat(pts.shift())
          cx = cx + parseFloat(pts.shift())
          cy = cy + parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendBezier({controlPoints: [[${svg2cagX(x1, svgUnitsPmm)}, ${svg2cagY(y1, svgUnitsPmm)}], [${svg2cagX(bx, svgUnitsPmm)}, ${svg2cagY(by, svgUnitsPmm)}], [${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]]}, ${pathName})\n`
          let rf = reflect(bx, by, cx, cy)
          bx = rf[0]
          by = rf[1]
        }
        break
      case 'C': // absolute cubic Bézier
        while (pts.length >= 6) {
          let x1 = parseFloat(pts.shift())
          let y1 = parseFloat(pts.shift())
          bx = parseFloat(pts.shift())
          by = parseFloat(pts.shift())
          cx = parseFloat(pts.shift())
          cy = parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendBezier({controlPoints: [[${svg2cagX(x1, svgUnitsPmm)}, ${svg2cagY(y1, svgUnitsPmm)}], [${svg2cagX(bx, svgUnitsPmm)}, ${svg2cagY(by, svgUnitsPmm)}], [${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]]}, ${pathName})\n`
          let rf = reflect(bx, by, cx, cy)
          bx = rf[0]
          by = rf[1]
        }
        break
      case 'q': // relative quadratic Bézier
        while (pts.length >= 4) {
          qx = cx + parseFloat(pts.shift())
          qy = cy + parseFloat(pts.shift())
          cx = cx + parseFloat(pts.shift()) // end point
          cy = cy + parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendBezier({controlPoints: [[${svg2cagX(qx, svgUnitsPmm)}, ${svg2cagY(qy, svgUnitsPmm)}], [${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]]}, ${pathName})\n`
          let rf = reflect(qx, qy, cx, cy)
          qx = rf[0]
          qy = rf[1]
        }
        break
      case 'Q': // absolute quadratic Bézier
        while (pts.length >= 4) {
          qx = parseFloat(pts.shift())
          qy = parseFloat(pts.shift())
          cx = parseFloat(pts.shift()) // end point
          cy = parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendBezier({controlPoints: [[${svg2cagX(qx, svgUnitsPmm)}, ${svg2cagY(qy, svgUnitsPmm)}], [${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]]}, ${pathName})\n`
          let rf = reflect(qx, qy, cx, cy)
          qx = rf[0]
          qy = rf[1]
        }
        break
      case 't': // relative quadratic Bézier shorthand
        while (pts.length >= 2) {
          cx = cx + parseFloat(pts.shift()) // end point
          cy = cy + parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendBezier({controlPoints: [[${svg2cagX(qx, svgUnitsPmm)}, ${svg2cagY(qy, svgUnitsPmm)}], [${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]]}, ${pathName})\n`
          let rf = reflect(qx, qy, cx, cy)
          qx = rf[0]
          qy = rf[1]
        }
        break
      case 'T': // absolute quadratic Bézier shorthand
        while (pts.length >= 2) {
          cx = parseFloat(pts.shift()) // end point
          cy = parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendBezier({controlPoints: [[${svg2cagX(qx, svgUnitsPmm)}, ${svg2cagY(qy, svgUnitsPmm)}], [${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]]}, ${pathName})\n`
          let rf = reflect(qx, qy, cx, cy)
          qx = rf[0]
          qy = rf[1]
        }
        break
      case 's': // relative cubic Bézier shorthand
        while (pts.length >= 4) {
          let x1 = bx // reflection of 2nd control point from previous C
          let y1 = by // reflection of 2nd control point from previous C
          bx = cx + parseFloat(pts.shift())
          by = cy + parseFloat(pts.shift())
          cx = cx + parseFloat(pts.shift())
          cy = cy + parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendBezier({controlPoints: [[${svg2cagX(x1, svgUnitsPmm)}, ${svg2cagY(y1, svgUnitsPmm)}], [${svg2cagX(bx, svgUnitsPmm)}, ${svg2cagY(by, svgUnitsPmm)}], [${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]]}, ${pathName})\n`
          let rf = reflect(bx, by, cx, cy)
          bx = rf[0]
          by = rf[1]
        }
        break
      case 'S': // absolute cubic Bézier shorthand
        while (pts.length >= 4) {
          let x1 = bx // reflection of 2nd control point from previous C
          let y1 = by // reflection of 2nd control point from previous C
          bx = parseFloat(pts.shift())
          by = parseFloat(pts.shift())
          cx = parseFloat(pts.shift())
          cy = parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendBezier({controlPoints: [[${svg2cagX(x1, svgUnitsPmm)}, ${svg2cagY(y1, svgUnitsPmm)}], [${svg2cagX(bx, svgUnitsPmm)}, ${svg2cagY(by, svgUnitsPmm)}], [${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]]}, ${pathName})\n`
          let rf = reflect(bx, by, cx, cy)
          bx = rf[0]
          by = rf[1]
        }
        break
      case 'h': // relative Horzontal line to
        while (pts.length >= 1) {
          cx = cx + parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendPoints([[${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]], ${pathName})\n`
        }
        break
      case 'H': // absolute Horzontal line to
        while (pts.length >= 1) {
          cx = parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendPoints([[${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]], ${pathName})\n`
        }
        break
      case 'l': // relative line to
        while (pts.length >= 2) {
          cx = cx + parseFloat(pts.shift())
          cy = cy + parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendPoints([[${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]], ${pathName})\n`
        }
        break
      case 'L': // absolute line to
        while (pts.length >= 2) {
          cx = parseFloat(pts.shift())
          cy = parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendPoints([[${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]], ${pathName})\n`
        }
        break
      case 'v': // relative Vertical line to
        while (pts.length >= 1) {
          cy = cy + parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendPoints([[${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]], ${pathName})\n`
        }
        break
      case 'V': // absolute Vertical line to
        while (pts.length >= 1) {
          cy = parseFloat(pts.shift())
          tmpCode += `${indent}${pathName} = geometry.path2.appendPoints([[${svg2cagX(cx, svgUnitsPmm)}, ${svg2cagY(cy, svgUnitsPmm)}]], ${pathName})\n`
        }
        break
      case 'z': // close current line
      case 'Z':
        tmpCode += `${indent}${pathName} = geometry.path2.close(${pathName})\n`
        if (target === 'geom2') {
          tmpCode += `${indent}${pathName} = geometry.geom2.fromPoints(geometry.path2.toPoints(${pathName}))\n`
        }
        tmpCode += `${indent}parts.push(${pathName})\n`

        cx = sx
        cy = sy // return to the starting point
        pc = true
        break
      default:
        console.log('Warning: Unknow PATH command [' + co.c + ']')
        break
    }
    // console.log('postion: ['+cx+','+cy+'] after '+co.c);
  }
  if (pi > 0 && pc === false) {
    tmpCode += `${indent}parts.push(${pathName})\n`
  }
  tmpCode += `${indent}${on} = parts\n`
  return tmpCode
}
