
import TreeView, { TreeNode } from 'jfw/ui/TreeView'
import { Dialog } from 'jfw/ui/dialog'
import { App } from 'jfw'

export default class OntologyTreeView extends TreeView {

    constructor(app:App, dialog:Dialog|undefined, ontology:any, rootTermID:string|null) {

        super(app, dialog)

        this.setNodeFetcher(fetchNodes)

        // TODO make fetchNodes only fetch subnodes on demand so don't have
        // to create TreeNodes for the entire ontology.
        //
        function fetchNodes():Array<TreeNode> {

            if(rootTermID) {
                return mapNodes(ontology[rootTermID].children)
            } else {
                throw new Error('cant do that yet')
            }

            function mapNodes(nodeIDs:string[]):TreeNode[] {
                return nodeIDs.map((id) => {
                    let term = ontology[id]
                    let node = new TreeNode()
                    node.id = id
                    node.title = term.name
                    node.subnodes = term.children ? mapNodes(term.children) : []
                    return node
                })
            }


        }
    }

}

