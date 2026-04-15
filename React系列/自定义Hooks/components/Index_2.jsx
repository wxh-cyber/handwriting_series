import useWindowSize from '../hooks/useWindowSize';

function Index_2() {
    const {width,height}=useWindowSize();

    return (
        <div>
            <p>当前窗口宽度：{width}</p>
            <p>当前窗口高度：{height}</p>
        </div>
    )
}

export default Index_2;
