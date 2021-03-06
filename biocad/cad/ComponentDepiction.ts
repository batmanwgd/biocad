import LabelDepiction from 'biocad/cad/LabelDepiction';

import Depiction, { Opacity, Orientation, Fade }  from './Depiction'

import { VNode, svg } from 'jfw/vdom'

import { Matrix, Vec2 } from 'jfw/geom'

import {
    SXIdentified,
    SXComponent,
    SXSubComponent
} from "sbolgraph"

import Layout from './Layout'

import visbolite from 'visbolite'

import parts, { shortNameFromTerm } from 'data/parts'

import RenderContext from './RenderContext'
import CircularBackboneDepiction from 'biocad/cad/CircularBackboneDepiction';
import BackboneDepiction from 'biocad/cad/BackboneDepiction';

import extend = require('xtend')
import IdentifiedChain from '../IdentifiedChain';

import LocationableDepiction from './LocationableDepiction'

export default class ComponentDepiction extends LocationableDepiction {

    constructor(layout:Layout, depictionOf:SXIdentified|undefined, identifiedChain:IdentifiedChain|undefined, parent?:Depiction, uid?:number) {

        super(layout, depictionOf, identifiedChain, parent, uid)

    }

    render(renderContext:RenderContext):VNode {

        if(CircularBackboneDepiction.ancestorOf(this)) {
            if(this.opacity === Opacity.Whitebox) {
                return this.renderCircularWhitebox(renderContext)
            } else {
                return this.renderCircularBlackbox(renderContext)
            }
        } else {
            if(this.opacity === Opacity.Whitebox) {
                return this.renderWhitebox(renderContext)
            } else {
                return this.renderBlackbox(renderContext)
            }
        }
    }

    private renderWhitebox(renderContext:RenderContext):VNode {

        const children:Array<Depiction> = this.children

        const offset = this.absoluteOffset.multiply(renderContext.layout.gridSize)
        const size = this.size.multiply(renderContext.layout.gridSize)

        const transform = Matrix.translation(offset)


        let attr = {}

        if(this.fade === Fade.Full) {
            attr['opacity'] = '0.2'
        } else if(this.fade === Fade.Partial) {
            attr['opacity'] = '0.5'
        }

        return svg('rect', extend(attr, {
            transform: transform.toSVGString(),
            width: size.x,
            height: size.y,
            fill: 'none',
            stroke: '#333',
            rx: '4px',
            ry: '4px',
            'stroke-width': '2px'
        }))

    }

    public getDefinition():SXComponent {

        const depictionOf:SXIdentified|undefined = this.depictionOf

        if(depictionOf === undefined)
            throw new Error('???')

        var definition
        
        if(depictionOf instanceof SXSubComponent) {
            definition = (depictionOf as SXSubComponent).instanceOf
        } else if(depictionOf instanceof SXSubComponent) {
            definition = (depictionOf as SXSubComponent).instanceOf
        } else if(depictionOf instanceof SXComponent) {
            definition = depictionOf as SXComponent
        } else {
            throw new Error('???')
        }

        return definition
    }

    private getGlyphType():string {

        const definition:SXComponent = this.getDefinition()

        const roles = definition.roles

        for(var i = 0; i < roles.length; ++ i) {

            const shortName = shortNameFromTerm(roles[i])

            if(shortName)
                return shortName
        }

        return 'user-defined'
    }

    private renderBlackbox(renderContext:RenderContext):VNode {

        const depictionOf:SXIdentified|undefined = this.depictionOf

        if(depictionOf === undefined)
            throw new Error('???')


        const orientation = this.orientation


        const definition:SXComponent = this.getDefinition()

        const type = this.getGlyphType()

        var offset = this.absoluteOffset.multiply(renderContext.layout.gridSize)
        const size = this.size.multiply(renderContext.layout.gridSize)

        var transform = Matrix.identity()
        
        transform = transform.multiply(Matrix.translation(offset))

        if(orientation === Orientation.Reverse) {
            transform = transform.rotate(180, Vec2.fromXY(size.x * 0.5, size.y * 0.5))
        }

             

        const attr = {
            transform: transform.toSVGString()
        }

        if(this.fade === Fade.Full) {
            attr['opacity'] = '0.2'
        } else if(this.fade === Fade.Partial) {
            attr['opacity'] = '0.5'
        }
        
        return svg('g', attr, [
            visbolite.render({
                type: type,
                size: size
            })
        ])

    }


    private renderCircularBlackbox(renderContext:RenderContext):VNode {


        return visbolite.render({
            type: 'plasmid-annotation',
            startPoint: Vec2.fromXY(0, 0),
            endPoint: this.size
        })


    }

    private renderCircularWhitebox(renderContext:RenderContext):VNode {

        const children:Array<Depiction> = this.children

        const offset = this.absoluteOffset.multiply(renderContext.layout.gridSize)
        const size = this.size.multiply(renderContext.layout.gridSize)

        const transform = Matrix.translation(offset)

        return svg('rect', {
            transform: transform.toSVGString(),
            width: size.x,
            height: size.y,
            fill: 'none',
            stroke: '#333',
            rx: '4px',
            ry: '4px',
            'stroke-width': '2px'
        })

    }


    renderThumb(size:Vec2):VNode {

        const orientation = this.orientation

        const definition:SXComponent = this.getDefinition()

        const type = this.getGlyphType()


        return svg('g', [
            visbolite.render({
                color: 'white',
                stroke: 'none',
                type: type,
                size: size,
                autoApplyScale: true
            })
        ])
    }


    isSelectable():boolean {
        return true
    }

    getConstrainedSiblings():Depiction[] {

        let dOf = this.depictionOf

        if(!dOf) 
            return []

        let s:Depiction[] = []

        if(dOf instanceof SXSubComponent) {
            let constrainedSCs =
                dOf.getConstraintsWithThisSubject().map((c) => c.object)
                    .concat(
                        dOf.getConstraintsWithThisObject().map((c) => c.subject)
                    )

            for(let sc of constrainedSCs) {

                let depictions = this.layout.getDepictionsForUri(sc.uri)

                let siblingDepictions = depictions.filter((d) => {
                    return d.parent === this.parent
                })

                s = s.concat(siblingDepictions)
            }
        }

        return s
    }
}


