
import { Rect } from "jfw/geom";
import Depiction, { Opacity } from "biocad/cad/Depiction";
import { SBOLXGraph, SXComponent, SXSubComponent } from "sbolgraph";
import Layout from "biocad/cad/Layout";
import DOp, { DOpResult } from "./DOp";
import ComponentDepiction from "../ComponentDepiction";
import BackboneDepiction from "../BackboneDepiction";

export default class DOpEnterParent extends DOp {

    test(
        sourceLayout:Layout, sourceGraph:SBOLXGraph,
        targetLayout:Layout, targetGraph:SBOLXGraph,
        sourceDepiction:Depiction,
        targetBBox:Rect,
        ignoreURIs:string[]):DOpResult|null {

            let intersectingDs = targetLayout.getDepictionsIntersectingRect(targetBBox, false)

            if(sourceDepiction.parent) {
                if (intersectingDs.indexOf(sourceDepiction.parent) !== -1) {
                    return null // Still overlapping our parent
                }
            }

            for(let intersecting of intersectingDs) {

                let ignored = false
                for(let uri of ignoreURIs) {
                    if(intersecting.identifiedChain && intersecting.identifiedChain.containsURI(uri)) {
                        ignored = true
                        break
                    }
                }
                if(ignored)
                    continue

                if(intersecting.isDescendentOf(sourceDepiction)) {
                    continue // Can't become a parent of our child
                }

                if(!intersecting.isSelectable()) {
                    continue
                }

                if(intersecting instanceof ComponentDepiction) {
                    if(intersecting.opacity === Opacity.Blackbox) {
                        continue
                    }
                }

                // Ok let's do it

                let newGraph = targetGraph.clone()

                if(targetGraph !== sourceGraph) {
                    newGraph.addAll(sourceGraph)
                }

                let newLayout = targetLayout.cloneWithNewGraph(newGraph)



                let intersectingInNewLayout = newLayout.getDepictionForUid(intersecting.uid)
                
                if(!intersectingInNewLayout) {
                    throw new Error('???')
                }




                let intersectingInNewLayoutDOf = intersectingInNewLayout.depictionOf

                if(!intersectingInNewLayoutDOf) {
                    throw new Error('???')
                }

                var newParentC:SXComponent|undefined

                if(intersectingInNewLayoutDOf instanceof SXSubComponent) {
                    newParentC = intersectingInNewLayoutDOf.instanceOf
                } else if(intersectingInNewLayoutDOf instanceof SXComponent) {
                    newParentC = intersectingInNewLayoutDOf
                } else {
                    throw new Error('???')
                }

                let chain = intersectingInNewLayout.identifiedChain

                if(chain === undefined) {
                    throw new Error('???')
                }

                let srcDOf = sourceDepiction.depictionOf

                if(!srcDOf) {
                    throw new Error('???')
                }

                let dOf = newGraph.uriToFacade(srcDOf.uri)

                if(!dOf) {
                    throw new Error('???')
                }

                let sc:SXSubComponent|undefined = undefined

                if(dOf instanceof SXSubComponent) {

                    // already a sc
                    // create new sc in parent, delete our dOf

                    sc = newParentC.createSubComponent(dOf.instanceOf)

                    dOf.destroy()

                } else if(dOf instanceof SXComponent) {

                    // a c
                    // create new sc in parent

                    sc = newParentC.createSubComponent(dOf)
                }

                if(!sc) {
                    throw new Error('???')
                }

                newLayout.syncAllDepictions(5)

                
                let ds = newLayout.getDepictionsForUri(sc.uri)

                if(ds.length === 0) {
                    throw new Error('???')
                }

                // highest uid is most recently modified
                ds.sort((a, b) => b.uid - a.uid)

                let newD = ds[0]


                newD.offsetExplicit = sourceDepiction.offsetExplicit

                if(sourceDepiction.parent)
                    newD.offset = sourceDepiction.offset.add(sourceDepiction.parent.offset)



                newLayout.configurate([])


                return {
                    newLayout,
                    newGraph,
                    validForRect:intersecting.absoluteBoundingBox.expand(1),
                    replacements: [
                        {
                            old: sourceDepiction,
                            new: newD
                        }
                    ]
                }

            }

            return null


        }


}