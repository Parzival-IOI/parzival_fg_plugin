 
function testing ( data: {
    name: string,
    x: number,
    y: number,
    width: number,
    height: number,
    type: string,
    Text?: {
        font: string,
        fontWeight: string,
        fontSize: string,
        lineHeight: string,
        letterSpacing: string,
        alignment: string
    },
    image?: {
        link: string
    }
    fill: string,
    opacity: number,
    cornerRadious: number,
    rotation: number
}[]) {
    return "";
}
type component = {
    name: string,
    type: "Text" | "Rectagle" | "Line" | "Arrow" | "Ellipse" | "Polygon" | "Star" | "Image",
    position: {
        x: number,
        y: number
    },
    size: {
        width: number,
        height: number
    }
}[]
